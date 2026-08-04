import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache

from .models import SenderRole, SupportTicket, TicketStatus
from .serializers import SupportMessageSerializer
from .services import save_and_broadcast, ticket_group_name
from .tasks import notify_offline_recipient_task, run_ai_triage_task

logger = logging.getLogger("varnis.support.ws")

PRESENCE_TTL_SECONDS = 60 * 10


def _presence_key(ticket_id, user_id) -> str:
    return f"support:presence:{ticket_id}:{user_id}"


class SupportChatConsumer(AsyncWebsocketConsumer):
    """
    One connection per (ticket, connected user). Both the citizen's app
    and the assigned agent's console connect to the SAME group for a
    given ticket_id and receive every message live.

    Client protocol — see docs/API_INTEGRATION.md for full spec.
    """

    async def connect(self):
        self.user = self.scope["user"]
        self.ticket_id = self.scope["url_route"]["kwargs"]["ticket_id"]

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)  # unauthorized
            return

        ticket = await self._get_ticket()
        if ticket is None:
            await self.close(code=4404)  # not found
            return

        if not await self._user_can_access(ticket):
            await self.close(code=4403)  # forbidden
            return

        self.group_name = ticket_group_name(self.ticket_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        cache.set(_presence_key(self.ticket_id, self.user.id), True, PRESENCE_TTL_SECONDS)

        await self.send(text_data=json.dumps({
            "type": "connection.ack",
            "payload": {"ticket_id": str(self.ticket_id), "status": ticket.status},
        }))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if hasattr(self, "user") and self.user and self.user.is_authenticated:
            cache.delete(_presence_key(self.ticket_id, self.user.id))

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except (TypeError, json.JSONDecodeError):
            await self._send_error("invalid_json", "Message body must be valid JSON.")
            return

        event = data.get("event")

        if event == "message.send":
            await self._handle_message_send(data.get("payload", {}))
        elif event == "typing":
            await self._handle_typing(data.get("payload", {}))
        else:
            await self._send_error("unknown_event", f"Unrecognized event '{event}'.")

    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------

    async def _handle_message_send(self, payload: dict):
        text = (payload.get("message") or "").strip()
        attachment_url = payload.get("attachment_url")

        if not text and not attachment_url:
            await self._send_error("empty_message", "Message text or attachment is required.")
            return

        ticket = await self._get_ticket()
        if ticket is None or ticket.status == TicketStatus.CLOSED:
            await self._send_error("ticket_closed", "This ticket is closed.")
            return

        sender_role = SenderRole.AGENT if await self._is_agent() else SenderRole.CITIZEN

        message = await database_sync_to_async(save_and_broadcast)(
            ticket=ticket,
            sender=self.user,
            sender_role=sender_role,
            text=text,
            attachment_url=attachment_url,
        )

        # Notify the other party if they're not currently connected.
        await self._notify_if_offline(ticket, sender_role, message)

        # Trigger AI triage only for citizen messages on tickets still
        # being auto-handled (i.e. not yet escalated to a human).
        if sender_role == SenderRole.CITIZEN and ticket.auto_handled:
            run_ai_triage_task.delay(str(ticket.id), str(message.id))

    async def _handle_typing(self, payload: dict):
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "typing.event",
                "payload": {
                    "user_id": str(self.user.id),
                    "is_typing": bool(payload.get("is_typing", True)),
                },
            },
        )

    # ------------------------------------------------------------------
    # Group event -> WebSocket frame relays
    # (method names must match the "type" used in group_send calls)
    # ------------------------------------------------------------------

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat.message",
            "payload": event["payload"],
        }))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "payload": event["payload"],
        }))

    async def ticket_closed(self, event):
        await self.send(text_data=json.dumps({
            "type": "ticket.closed",
            "payload": event["payload"],
        }))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _send_error(self, code: str, detail: str):
        await self.send(text_data=json.dumps({
            "type": "error",
            "payload": {"code": code, "detail": detail},
        }))

    @database_sync_to_async
    def _get_ticket(self):
        try:
            return SupportTicket.objects.select_related("user", "assigned_agent").get(
                id=self.ticket_id
            )
        except SupportTicket.DoesNotExist:
            return None

    @database_sync_to_async
    def _user_can_access(self, ticket) -> bool:
        return (
            ticket.user_id == self.user.id
            or ticket.assigned_agent_id == self.user.id
            or self.user.is_staff
            or hasattr(self.user, "support_agent_profile")
        )

    @database_sync_to_async
    def _is_agent(self) -> bool:
        return self.user.is_staff or hasattr(self.user, "support_agent_profile")

    async def _notify_if_offline(self, ticket, sender_role, message):
        recipient_id = (
            ticket.assigned_agent_id if sender_role == SenderRole.CITIZEN else ticket.user_id
        )
        if not recipient_id:
            return  # e.g. citizen messaging before an agent has claimed the ticket

        recipient_online = cache.get(_presence_key(self.ticket_id, recipient_id))
        if not recipient_online:
            notify_offline_recipient_task.delay(
                str(recipient_id), str(ticket.id), message.message
            )
