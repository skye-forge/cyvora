from django.conf import settings
from django.db import models
from django.utils import timezone

from shared.models.base import BaseModel
from shared.constants import InstitutionType, LicenseTier, InstitutionMemberRole

LICENSE_VALIDITY_DAYS = 365


class Institution(BaseModel):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=InstitutionType.CHOICES)
    region = models.CharField(max_length=100)
    logo_url = models.URLField(blank=True)

    subscription_tier = models.CharField(
        max_length=20,
        choices=LicenseTier.CHOICES,
        null=True,
        blank=True,
        help_text="Null until the first license payment succeeds.",
    )
    expires_at = models.DateTimeField(null=True, blank=True)

    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="institutions_registered",
    )

    class Meta:
        db_table = "institutions"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def is_active(self) -> bool:
        return bool(self.expires_at and timezone.now() < self.expires_at)


class InstitutionMembership(BaseModel):
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="institution_memberships",
    )
    role = models.CharField(
        max_length=10,
        choices=InstitutionMemberRole.CHOICES,
        default=InstitutionMemberRole.MEMBER,
    )

    class Meta:
        db_table = "institution_memberships"
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "user"], name="unique_membership_per_institution"
            )
        ]

    def __str__(self):
        return f"{self.user} @ {self.institution} ({self.role})"


class InstitutionLicensePricing(BaseModel):
    """
    FR-parallel to CertificatePricing: admin-configurable pricing per
    tier, independent of a specific Institution row.
    """

    tier = models.CharField(max_length=20, choices=LicenseTier.CHOICES, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="XAF")
    seat_limit = models.PositiveIntegerField(
        help_text="Max enrolled users under this tier."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "institution_license_pricing"

    def __str__(self):
        return f"{self.tier} — {self.amount} {self.currency}"
