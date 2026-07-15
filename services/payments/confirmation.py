"""
Provider webhook confirmation → on success, issues the certificate.
This is the only path that produces a paid certificate (FR-CERT-03:
"only after payment success").

Concurrency note: payment providers retry webhook delivery (at-least-once
delivery is the norm, not the exception). Without row locking, two
near-simultaneous deliveries for the same transaction_ref can both read
status=PENDING before either writes, and both would issue a certificate.
select_for_update() inside an atomic block makes the second request block
until the first commits, then see the updated status and reject cleanly —
this is what makes the endpoint idempotent under real concurrent delivery,
not just under sequential test calls.
"""
from django.db import transaction

from apps.payments.models import Payment
from shared.enums.certification import PaymentStatus
from shared.exceptions import NotFoundError, ValidationFailedError


def confirm_payment(*, transaction_ref: str, success: bool) -> Payment:
    with transaction.atomic():
        try:
            payment = (
                Payment.objects.select_for_update()
                .select_related("user")
                .get(transaction_ref=transaction_ref)
            )
        except Payment.DoesNotExist:
            raise NotFoundError("Payment not found.")

        if payment.status != PaymentStatus.PENDING.value:
            raise ValidationFailedError(
                f"Payment already {payment.status}; ignoring duplicate confirmation."
            )

        if not success:
            payment.mark_failed()
            return payment

        tier = payment.metadata.get("tier") if payment.metadata else None
        payment.mark_success()

        if tier:
            from services.certificates.generator import issue_certificate
            from services.certificates.services import issue_certificate_for_payment
            issue_certificate_for_payment(user=payment.user, tier=tier, payment=payment)

        return payment
