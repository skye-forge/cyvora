import logging
from typing import Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

from .models import SenderRole, SupportMessage, SupportTicket, TicketStatus
from .serializers import SupportMessageSerializer, SupportTicketSerializer

logger = logging.getLogger("varnis.support")


def ticket_group_name(ticket_id) -> str:
    return f"support_ticket_{ticket_id}"


QUEUE_GROUP_NAME = "support_agent_queue"


def broadcast_to_ticket(ticket_id, event_type: str, payload: dict) -> None:
    """
    Pushes an event to every WebSocket connection currently joined to this
    ticket's group (citizen app + agent console, whoever is connected).
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("No channel layer configured; skipping broadcast")
        return

    async_to_sync(channel_layer.group_send)(
        ticket_group_name(ticket_id),
        {"type": event_type, "payload": payload},
    )


def broadcast_queue_update(ticket: SupportTicket) -> None:
    """Notifies agent dashboards that a new ticket needs a human (or was resolved)."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        QUEUE_GROUP_NAME,
        {
            "type": "queue.update",
            "payload": SupportTicketSerializer(ticket).data,
        },
    )


def create_ticket(
    user,
    subject: str,
    category: str,
    first_message: str,
    attachment_url: Optional[str] = None,
) -> SupportTicket:
    ticket = SupportTicket.objects.create(
        user=user,
        subject=subject or first_message[:80],
        category=category,
        status=TicketStatus.OPEN,
        auto_handled=True,
    )

    save_message(
        ticket=ticket,
        sender=user,
        sender_role=SenderRole.CITIZEN,
        text=first_message,
        attachment_url=attachment_url,
    )

    return ticket


def save_message(
    ticket: SupportTicket,
    sender,
    sender_role: str,
    text: str,
    attachment_url: Optional[str] = None,
    is_ai_generated: bool = False,
) -> SupportMessage:
    message = SupportMessage.objects.create(
        ticket=ticket,
        sender=sender,
        sender_role=sender_role,
        message=text or "",
        attachment_url=attachment_url,
        is_ai_generated=is_ai_generated,
    )
    ticket.save(update_fields=[])  # bump updated_at via auto_now
    return message


def save_and_broadcast(
    ticket: SupportTicket,
    sender,
    sender_role: str,
    text: str,
    attachment_url: Optional[str] = None,
    is_ai_generated: bool = False,
) -> SupportMessage:
    message = save_message(
        ticket=ticket,
        sender=sender,
        sender_role=sender_role,
        text=text,
        attachment_url=attachment_url,
        is_ai_generated=is_ai_generated,
    )
    broadcast_to_ticket(
        ticket.id,
        event_type="chat.message",
        payload=SupportMessageSerializer(message).data,
    )
    return message


def escalate_ticket(ticket: SupportTicket, reason: str) -> None:
    ticket.auto_handled = False
    ticket.escalation_reason = reason
    ticket.save(update_fields=["auto_handled", "escalation_reason", "updated_at"])

    save_and_broadcast(
        ticket=ticket,
        sender=None,
        sender_role=SenderRole.SYSTEM,
        text=(
            "Connecting you to a human support agent. Please hold on — "
            "a member of our team will join shortly."
        ),
    )

    broadcast_queue_update(ticket)


def assign_agent(ticket: SupportTicket, agent_user) -> SupportTicket:
    ticket.assigned_agent = agent_user
    ticket.status = TicketStatus.ASSIGNED
    ticket.save(update_fields=["assigned_agent", "status", "updated_at"])

    save_and_broadcast(
        ticket=ticket,
        sender=None,
        sender_role=SenderRole.SYSTEM,
        text=f"{agent_user.get_full_name() or agent_user.get_username()} has joined the chat.",
    )
    return ticket


def close_ticket(ticket: SupportTicket) -> SupportTicket:
    ticket.status = TicketStatus.CLOSED
    ticket.closed_at = timezone.now()
    ticket.save(update_fields=["status", "closed_at", "updated_at"])

    broadcast_to_ticket(
        ticket.id,
        event_type="ticket.closed",
        payload={"ticket_id": str(ticket.id), "closed_at": ticket.closed_at.isoformat()},
    )
    return ticket
