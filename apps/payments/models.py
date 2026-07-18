import uuid

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class PaymentMethod(models.TextChoices):
    MTN = "MTN", "MTN Mobile Money"
    ORANGE = "ORANGE", "Orange Money"
    CARD = "CARD", "Card Payment"  # not active yet, reserved for future gateway


class PaymentPurpose(models.TextChoices):
    TRACKING_FEE = "TRACKING_FEE", "Tracking Request Fee"
    INSTITUTION_LICENSE = "INSTITUTION_LICENSE", "Institution Licensing"
    # CERTIFICATION intentionally omitted — not needed for this competition build.
    # Re-add here + in admin.py list_filter when certification is switched back on.


class PaymentSubmissionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"  # created, no proof uploaded yet
    SUBMITTED = "SUBMITTED", "Submitted"  # proof uploaded, awaiting review
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"  # an admin has opened it
    VERIFIED = "VERIFIED", "Verified"  # approved — unlocks related object
    REJECTED = "REJECTED", "Rejected"
    PROOF_REQUESTED = (
        "PROOF_REQUESTED",
        "Proof Requested",
    )  # admin asked for new/clearer proof
    REFUNDED = "REFUNDED", "Refunded"


class PaymentConfiguration(models.Model):
    """
    Admin-managed payment destination. Finance can rotate numbers without
    a deployment. Multiple accounts per method are allowed; only one
    should be marked active per method at a time (enforced in save()).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    label = models.CharField(
        max_length=100,
        blank=True,
        help_text="Internal label, e.g. 'Finance Account 1' — not shown to users.",
    )

    account_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=20)
    reference_code = models.CharField(
        max_length=50,
        help_text="Code users should quote as payment reference, e.g. VRN2026.",
    )
    instructions = models.TextField(blank=True)

    is_active = models.BooleanField(
        default=False,
        help_text="Only one active configuration per payment_method is served to users.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["payment_method", "-is_active", "-updated_at"]
        verbose_name = "Payment Configuration"
        verbose_name_plural = "Payment Configurations"

    def __str__(self):
        status = "active" if self.is_active else "inactive"
        return f"{self.get_payment_method_display()} — {self.account_name} ({status})"

    def save(self, *args, **kwargs):
        # Enforce single active config per method at the model layer as a
        # safety net (also enforced in the admin/service layer).
        if self.is_active:
            PaymentConfiguration.objects.filter(
                payment_method=self.payment_method, is_active=True
            ).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class PaymentSubmission(models.Model):
    """
    One record per user attempt to pay. Since there is no payment gateway
    integration yet, verification is manual: a finance/admin user reviews
    the uploaded proof and approves or rejects it. approve() is the single
    trigger point that should unlock whatever the payment was for — when a
    real gateway is added later, its webhook can call the same unlock path.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_submissions",
    )

    purpose = models.CharField(max_length=30, choices=PaymentPurpose.choices)

    # Polymorphic link to whatever this payment unlocks (TrackingRequest,
    # Institution, etc.) without a hard FK per purpose. Resolve via
    # get_related_object() in services rather than joining directly.
    related_object_id = models.UUIDField(null=True, blank=True)

    payment_configuration = models.ForeignKey(
        PaymentConfiguration,
        on_delete=models.PROTECT,
        related_name="submissions",
        help_text="Which account the user was instructed to pay.",
    )

    payer_name = models.CharField(max_length=150)
    payer_phone = models.CharField(max_length=20)
    amount_expected = models.DecimalField(max_digits=10, decimal_places=2)
    amount_declared = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    transaction_ref = models.CharField(max_length=100, blank=True)
    proof_file = models.FileField(upload_to="documents/payments/%Y/%m/")

    status = models.CharField(
        max_length=20,
        choices=PaymentSubmissionStatus.choices,
        default=PaymentSubmissionStatus.PENDING,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_reviews",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    proof_request_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment Submission"
        verbose_name_plural = "Payment Submissions"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["purpose", "related_object_id"]),
        ]

    def __str__(self):
        return f"{self.get_purpose_display()} — {self.payer_name} ({self.status})"

    @property
    def amount_matches(self) -> bool:
        return self.amount_declared == self.amount_expected


class Payment(models.Model):
    PURPOSE_CERTIFICATION = "certification"
    PURPOSE_INSTITUTION_LICENSE = "institution_license"
    PURPOSE_CHOICES = [
        (PURPOSE_CERTIFICATION, "Certification"),
        (PURPOSE_INSTITUTION_LICENSE, "Institution License"),
    ]

    PROVIDER_MOMO = "momo"
    PROVIDER_ORANGE = "orange_money"
    PROVIDER_CARD = "card"
    PROVIDER_CHOICES = [
        (PROVIDER_MOMO, "Momo"),
        (PROVIDER_ORANGE, "Orange Money"),
        (PROVIDER_CARD, "Card"),
    ]

    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments"
    )
    purpose = models.CharField(
        max_length=30, choices=PURPOSE_CHOICES, default=PURPOSE_CERTIFICATION
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="XAF")
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    transaction_ref = models.CharField(max_length=32, unique=True, db_index=True)
    provider_reference = models.CharField(
        max_length=150,
        blank=True,
        help_text="ID/ref returned by MoMo/OM/card gateway once initiated.",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "-created_at"], name="payments_status_db6b16_idx"
            ),
            models.Index(
                fields=["user", "-created_at"], name="payments_user_id_2c5fd7_idx"
            ),
        ]

    def __str__(self):
        return f"{self.get_purpose_display()} — {self.user} ({self.status})"
