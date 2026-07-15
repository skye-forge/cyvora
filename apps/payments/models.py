from django.conf import settings
from django.db import models

from shared.enums.certification import (
    PaymentProvider,
    PaymentStatus,
    PaymentPurpose,
    django_choices,
)
from shared.utils.reference_codes import generate_unique_reference_code


class Payment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments"
    )
    purpose = models.CharField(
        max_length=30,
        choices=django_choices(PaymentPurpose),
        default=PaymentPurpose.CERTIFICATION.value,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="XAF")

    provider = models.CharField(max_length=20, choices=django_choices(PaymentProvider))
    status = models.CharField(
        max_length=10,
        choices=django_choices(PaymentStatus),
        default=PaymentStatus.PENDING.value,
        db_index=True,
    )

    transaction_ref = models.CharField(max_length=32, unique=True, db_index=True)
    provider_reference = models.CharField(
        max_length=150,
        blank=True,
        help_text="ID/ref returned by MoMo/OM/card gateway once initiated.",
    )

    # e.g. {"course_id": "..."} — lets services.py resolve what this payment
    # was for without payments needing an FK to certificates/course models.
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.transaction_ref} — {self.provider} — {self.status}"

    def save(self, *args, **kwargs):
        if not self.transaction_ref:
            self.transaction_ref = generate_unique_reference_code(
                "PAY", Payment, field_name="transaction_ref", length=8
            )
        super().save(*args, **kwargs)

    def mark_success(self, provider_reference: str = ""):
        self.status = PaymentStatus.SUCCESS.value
        if provider_reference:
            self.provider_reference = provider_reference
        self.save(update_fields=["status", "provider_reference", "updated_at"])

        from .signals import payment_succeeded

        payment_succeeded.send(sender=Payment, payment=self)

    def mark_failed(self):
        self.status = PaymentStatus.FAILED.value
        self.save(update_fields=["status", "updated_at"])
