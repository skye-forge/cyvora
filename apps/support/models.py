import uuid

from django.conf import settings
from django.db import models


class TicketStatus(models.TextChoices):
    OPEN = "open", "Open"
    ASSIGNED = "assigned", "Assigned"
    CLOSED = "closed", "Closed"


class TicketCategory(models.TextChoices):
    REPORT_HELP = "report_help", "Report Help"
    CERTIFICATE = "certificate", "Certificate"
    TECHNICAL = "technical", "Technical"
    GENERAL = "general", "General"


class SenderRole(models.TextChoices):
    CITIZEN = "citizen", "Citizen"
    AGENT = "agent", "Agent"
    AI = "ai", "AI Assistant"
    SYSTEM = "system", "System"


class SupportTicket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )
    subject = models.CharField(max_length=255, blank=True)
    category = models.CharField(
        max_length=32, choices=TicketCategory.choices, default=TicketCategory.GENERAL
    )
    status = models.CharField(
        max_length=16, choices=TicketStatus.choices, default=TicketStatus.OPEN
    )

    # AI triage state
    auto_handled = models.BooleanField(default=True)
    escalation_reason = models.TextField(blank=True, null=True)

    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_support_tickets",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["status", "auto_handled"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"Ticket {self.id} ({self.status})"


class SupportMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_messages",
        help_text="Null when sender_role is 'ai' or 'system'.",
    )
    sender_role = models.CharField(max_length=16, choices=SenderRole.choices)
    message = models.TextField(blank=True)
    attachment_url = models.URLField(blank=True, null=True)

    # Set on AI-authored messages so the client can render an "AI Assistant"
    # badge and disclosure — required by product policy (AI must always
    # identify itself to the citizen).
    is_ai_generated = models.BooleanField(default=False)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["ticket", "created_at"])]

    def __str__(self):
        return f"[{self.sender_role}] {self.message[:40]}"


class SupportAgentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_agent_profile"
    )
    is_online = models.BooleanField(default=False)
    max_concurrent_tickets = models.PositiveIntegerField(default=5)

    @property
    def active_ticket_count(self) -> int:
        return self.user.assigned_support_tickets.filter(
            status=TicketStatus.ASSIGNED
        ).count()

    def __str__(self):
        return f"Agent {self.user}"
