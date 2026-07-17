from django.conf import settings
from django.db import models
from django.utils import timezone

from shared.constants import CertificateTier

CERTIFICATE_VALIDITY_DAYS = 365


def certificate_pdf_path(instance, filename):
    return f"certificates/pdf/{instance.cert_code}.pdf"


def certificate_qr_path(instance, filename):
    return f"certificates/qr/{instance.cert_code}.png"


class CertificatePricing(models.Model):
    """
    FR-CERT-06: admin-configurable pricing per certificate tier
    (Bronze/Silver/Gold) — NOT per course. This system's eligibility
    model is Zone-completion + tier-based, not course-track-based.
    """

    tier = models.CharField(max_length=10, choices=CertificateTier.CHOICES, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="XAF")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "certificate_pricing"

    def __str__(self):
        return f"{self.get_tier_display()} — {self.amount} {self.currency}"


class Certificate(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.PROTECT,
        related_name="certificate",
        null=True,
        blank=True,
        help_text="Set only after successful payment — issuance is gated behind this (FR-CERT-02/03).",
    )

    tier = models.CharField(max_length=10, choices=CertificateTier.CHOICES)
    cert_code = models.CharField(max_length=32, unique=True, db_index=True)

    institution = models.ForeignKey(
        "institutions.Institution",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="certificates",
    )

    pdf_file = models.FileField(upload_to=certificate_pdf_path, blank=True, null=True)
    qr_file = models.ImageField(upload_to=certificate_qr_path, blank=True, null=True)

    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "certificates"
        ordering = ["-issued_at"]
        indexes = [models.Index(fields=["cert_code"])]

    def __str__(self):
        return f"{self.get_tier_display()} — {self.user} ({self.cert_code})"

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def is_valid(self) -> bool:
        return not self.is_expired()

    @property
    def pdf_url(self):
        return self.pdf_file.url if self.pdf_file else None

    @property
    def qr_url(self):
        return self.qr_file.url if self.qr_file else None

    @property
    def verification_code(self):
        return self.cert_code
