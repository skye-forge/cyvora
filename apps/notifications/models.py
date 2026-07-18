import uuid

from django.conf import settings
from django.db import models


class EmailLog(models.Model):
    recipient = models.EmailField(max_length=254)
    subject = models.CharField(max_length=255)
    template_name = models.CharField(max_length=100, blank=True)
    provider_message_id = models.CharField(max_length=100, blank=True, null=True)
    STATUS_PENDING = "pending"
    STATUS_SENT = "sent"
    STATUS_DELIVERED = "delivered"
    STATUS_BOUNCED = "bounced"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SENT, "Sent"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_BOUNCED, "Bounced"),
        (STATUS_FAILED, "Failed"),
    ]
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "email_logs"
        indexes = [
            models.Index(fields=["status"], name="email_logs_status_e3be55_idx"),
            models.Index(fields=["recipient"], name="email_logs_recipie_df5c2b_idx"),
        ]

    def __str__(self):
        return f"{self.recipient} — {self.subject}"


class NotificationCategory(models.TextChoices):
    KYC = "KYC", "KYC"
    TRACKING = "TRACKING", "Tracking"
    PAYMENT = "PAYMENT", "Payment"
    LEARNING = "LEARNING", "Learning"
    NATIONAL_UPDATE = "NATIONAL_UPDATE", "National Update"
    SYSTEM = "SYSTEM", "System"


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
