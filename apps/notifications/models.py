from django.db import models


class EmailLog(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("bounced", "Bounced"),
        ("failed", "Failed"),
    ]

    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    template_name = models.CharField(max_length=100, blank=True)
    provider_message_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "email_logs"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["recipient"]),
        ]

    def __str__(self):
        return f"{self.recipient} — {self.subject} ({self.status})"
