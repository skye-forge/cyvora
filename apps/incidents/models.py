from django.conf import settings
from django.db import models


class IncidentCategory(models.Model):
    """Phishing, Scam Call, Fake Site, Physical Disturbance, Suspicious
    Activity, Service Outage, etc. — FR-INC-01."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "incident_categories"
        verbose_name_plural = "Incident categories"

    def __str__(self):
        return self.name


class Incident(models.Model):
    """
    Maps to the SRS's `IncidentReport` entity (Section 6). Field names
    follow the SRS directly (status values, rejection_reason, submitted_at,
    resolved_at) rather than the earlier Varnis draft's schema.

    Simplifications, flagged rather than silently made:
      - evidence_urls is a JSONField of URLs for now (FR-INC-03) rather
        than a related IncidentEvidence model — swap once a real
        multipart upload endpoint + object storage integration exists.
      - No stored `title`. FR-TRK-02 wants a "short title" in list views;
        that's derived from category + truncated description in the
        serializer rather than stored redundantly.
    """

    STATUS_PENDING = "pending"
    STATUS_UNDER_REVIEW = "under_review"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_UNDER_REVIEW, "Under Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    report_reference = models.CharField(max_length=20, unique=True, db_index=True)

    category = models.ForeignKey(
        IncidentCategory, on_delete=models.PROTECT, related_name="incidents"
    )
    description = models.TextField()
    evidence_urls = models.JSONField(default=list, blank=True)

    location_shared = models.BooleanField(default=False)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    rejection_reason = models.TextField(blank=True, null=True)

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reported_incidents",
        null=True,
        blank=True,
    )
    is_anonymous = models.BooleanField(default=False)

    submitted_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "incidents"
        ordering = ["-submitted_at"]
        indexes = [models.Index(fields=["report_reference"])]

    def __str__(self):
        return f"{self.report_reference} — {self.category}"

    @property
    def short_title(self) -> str:
        snippet = (
            (self.description[:40] + "…")
            if len(self.description) > 40
            else self.description
        )
        return f"{self.category.name}: {snippet}"

    def move_to_under_review(self):
        self.status = self.STATUS_UNDER_REVIEW
        self.save(update_fields=["status"])

    def approve(self):
        from django.utils import timezone

        self.status = self.STATUS_APPROVED
        self.resolved_at = timezone.now()
        self.save(update_fields=["status", "resolved_at"])
        # FR-MOD-03: approving a report should auto-generate a public
        # Community Alert post. apps.community doesn't exist yet —
        # wire in here once it does.

    def reject(self, reason: str = ""):
        from django.utils import timezone

        self.status = self.STATUS_REJECTED
        self.rejection_reason = reason
        self.resolved_at = timezone.now()
        self.save(update_fields=["status", "rejection_reason", "resolved_at"])


class ModerationLog(models.Model):
    """FR-MOD-05: every moderation action logged (who, what, when)."""

    incident = models.ForeignKey(
        Incident, on_delete=models.CASCADE, related_name="moderation_logs"
    )
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="moderation_actions",
    )
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "incident_moderation_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.incident.report_reference}: {self.from_status} → {self.to_status}"
        )
