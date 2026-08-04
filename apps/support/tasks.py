import logging

from celery import shared_task

from apps.ai_engine.triage.service import run_triage

from .models import SenderRole, SupportMessage, SupportTicket
from .services import broadcast_queue_update, escalate_ticket, save_and_broadcast

logger = logging.getLogger("varnis.support.tasks")

HISTORY_LIMIT = 10


@shared_task(name="support.run_ai_triage", bind=True, max_retries=2, default_retry_delay=5)
def run_ai_triage_task(self, ticket_id: str, message_id: str):
    """
    Runs after a citizen sends a message on a still-auto_handled ticket.
    Enqueued from the WebSocket consumer so the socket event loop is
    never blocked waiting on the Gemini/ML call.
    """
    try:
        ticket = SupportTicket.objects.select_related("user").get(id=ticket_id)
    except SupportTicket.DoesNotExist:
        logger.warning("run_ai_triage_task: ticket %s no longer exists", ticket_id)
        return

    # A human may have claimed the ticket while this task was queued —
    # don't let a stale AI reply land in an already-escalated/human chat.
    if not ticket.auto_handled:
        logger.info("Ticket %s no longer auto_handled; skipping AI reply", ticket_id)
        return

    try:
        latest_message = SupportMessage.objects.get(id=message_id)
    except SupportMessage.DoesNotExist:
        logger.warning("run_ai_triage_task: message %s no longer exists", message_id)
        return

    history_qs = (
        ticket.messages.exclude(id=message_id)
        .order_by("-created_at")[:HISTORY_LIMIT]
    )
    history = [
        f"{m.sender_role}: {m.message}" for m in reversed(list(history_qs))
    ]

    language = getattr(ticket.user, "language_pref", None) or "en"

    result = run_triage(
        message=latest_message.message,
        history=history,
        category=ticket.category,
        language=language,
    )

    if result.is_escalation():
        escalate_ticket(ticket, reason=result.reason or "Escalated by AI triage.")
        return

    save_and_broadcast(
        ticket=ticket,
        sender=None,
        sender_role=SenderRole.AI,
        text=result.reply,
        is_ai_generated=True,
    )


@shared_task(name="support.notify_offline_recipient")
def notify_offline_recipient_task(user_id: str, ticket_id: str, preview_text: str):
    """
    Fallback push notification (FCM) for when the recipient's WebSocket
    isn't connected. Wire this to your existing notifications app /
    FCM dispatcher — left as a thin call-out so this file doesn't
    duplicate notification-sending logic that already exists elsewhere
    in the platform.
    """
    from apps.notifications.services import _send_push  
    # from integrations.notifications.fcm_client import send_push_notification

    _send_push(
        user_id=user_id,
        title="New message from Support",
        body=preview_text[:120],
        data={"type": "support_message", "ticket_id": str(ticket_id)},
    )
