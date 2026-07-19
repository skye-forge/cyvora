
import uuid

from django.conf import settings
from django.db import models


class NotificationCategory(models.TextChoices):
    KYC = "KYC", "KYC"
    TRACKING = "TRACKING", "Tracking"
    PAYMENT = "PAYMENT", "Payment"
    LEARNING = "LEARNING", "Learning"
    NATIONAL_UPDATE = "NATIONAL_UPDATE", "National Update"
    SYSTEM = "SYSTEM", "System"


class EmailStatus(models.TextChoices):
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"


class EmailLog(models.Model):
    """
    One row per outbound email attempt via Resend. Written by
    notifications/services.py._send_email(). Kept separate from
    Notification since not every notification sends an email, and this
    is specifically an audit trail of provider calls (useful for
    debugging delivery issues without digging through app logs).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(
        "Notification",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="email_logs",
    )
    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    provider = models.CharField(max_length=20, default="RESEND")
    provider_message_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=EmailStatus.choices)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Email Log"
        verbose_name_plural = "Email Logs"

    def __str__(self):
        return f"{self.to_email} — {self.subject} ({self.status})"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    category = models.CharField(max_length=20, choices=NotificationCategory.choices)
    event = models.CharField(
        max_length=50, help_text="e.g. kyc_approved, tracking_status_changed"
    )
    title = models.CharField(max_length=150)
    message = models.CharField(max_length=500)
    related_entity_id = models.UUIDField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read"])]

    def __str__(self):
        return f"{self.user_id} — {self.event}"
