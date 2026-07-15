from django.db import models
from django.conf import settings

from shared.models.base import BaseModel
from shared.models.bilingual import BilingualContentMixin


class NationalUpdate(BaseModel, BilingualContentMixin):
    CATEGORY_CHOICES = [
        ("security_alert", "Security Alert"),
        ("guideline", "New Guideline"),
        ("advisory", "Advisory"),
        ("general", "General Announcement"),
    ]

    title_en = models.CharField(max_length=255)
    title_fr = models.CharField(max_length=255)
    body_en = models.TextField()
    body_fr = models.TextField()

    category = models.CharField(
        max_length=30, choices=CATEGORY_CHOICES, default="general"
    )
    urgency_flag = models.BooleanField(
        default=False
    )  # drives the "URGENT" badge, FR-NAT-02

    # null/empty list = broadcast to all regions. Otherwise a list of region
    # codes, e.g. ["centre", "littoral"]. Kept as JSONField rather than an
    # FK table since regions are a small fixed set (Cameroon's 10 regions).
    region_scope = models.JSONField(default=list, blank=True)

    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="published_updates",
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    # Tracks whether the push fan-out job has completed, so a retry/resend
    # doesn't double-notify everyone if publish_update() is called twice.
    push_dispatched = models.BooleanField(default=False)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["is_published", "-published_at"]),
            models.Index(fields=["urgency_flag"]),
        ]

    def __str__(self):
        return self.title_en

    def is_national(self) -> bool:
        return not self.region_scope
