import uuid

from django.conf import settings
from django.db import models


class KYCStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"


class IDDocumentType(models.TextChoices):
    NATIONAL_ID = "NATIONAL_ID", "National ID Card"
    PASSPORT = "PASSPORT", "Passport"
    DRIVER_LICENSE = "DRIVER_LICENSE", "Driver's License"


class KYCSubmission(models.Model):
    """
    One row per attempt. Resubmission never deletes or overwrites a prior
    row — it creates a new one and points back at the one it replaces via
    `supersedes`, so the full review history stays intact. Only one
    submission per user should have is_latest=True at a time; that is the
    one every other module (tracking, ownership verification, etc.) should
    check against.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="kyc_submissions",
    )

    id_document_type = models.CharField(max_length=20, choices=IDDocumentType.choices)
    id_number = models.CharField(max_length=50)
    full_name = models.CharField(max_length=150)
    date_of_birth = models.DateField()

    id_document_front = models.FileField(upload_to="documents/kyc/%Y/%m/")
    id_document_back = models.FileField(
        upload_to="documents/kyc/%Y/%m/", blank=True, null=True
    )
    selfie_photo = models.FileField(upload_to="documents/kyc/%Y/%m/")

    status = models.CharField(
        max_length=20, choices=KYCStatus.choices, default=KYCStatus.DRAFT
    )
    is_latest = models.BooleanField(
        default=True,
        help_text="True for the single active submission per user; older ones stay False.",
    )

    supersedes = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="superseded_by",
        help_text="Previous submission this one replaces, if this is a resubmission.",
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="kyc_reviews",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Set on approval — when this KYC record must be renewed.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "KYC Submission"
        verbose_name_plural = "KYC Submissions"
        indexes = [
            models.Index(fields=["user", "is_latest"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.full_name} — {self.status} ({'latest' if self.is_latest else 'history'})"


class KYCAuditLog(models.Model):
    """Append-only record of every KYC review action. Never edited or deleted."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(
        KYCSubmission, on_delete=models.CASCADE, related_name="audit_entries"
    )
    action = models.CharField(
        max_length=30
    )  # SUBMITTED, APPROVED, REJECTED, EXPIRED, RESUBMITTED
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "KYC Audit Log"
        verbose_name_plural = "KYC Audit Logs"

    def __str__(self):
        return f"{self.submission_id} — {self.action}"
