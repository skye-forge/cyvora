"""FR-CERT-02/06: initiate a payment for a certificate tier, with
transparent, admin-configurable pricing."""

from django.db import IntegrityError

from apps.certificates.models import CertificatePricing
from apps.payments.models import Payment
from integrations.payments.gateway import initiate as gateway_initiate
from services.certificates.eligibility import is_eligible_for
from shared.exceptions import NotFoundError, ValidationFailedError
from shared.utils.codes import generate_unique_code


def initiate_certificate_checkout(*, user, tier: str, provider: str) -> dict:
    """
    FR-CERT-02/06: Initiate a payment for a certificate.
    Returns checkout info (url, transaction_ref) from the payment provider.
    """
    if not is_eligible_for(user, tier):
        raise ValidationFailedError(
            f"User is not yet eligible for the {tier} certificate."
        )

    from apps.certificates.models import Certificate

    if Certificate.objects.filter(user=user, tier=tier).exists():
        raise ValidationFailedError(
            f"A {tier} certificate has already been issued to this user."
        )

    try:
        pricing = CertificatePricing.objects.get(tier=tier)
    except CertificatePricing.DoesNotExist:
        raise NotFoundError(
            f"No price configured for the {tier} tier yet — contact an administrator."
        )

    transaction_ref = generate_unique_code(prefix="PAY-")

    # Create pending payment record
    payment = Payment.objects.create(
        user=user,
        amount=pricing.amount,
        currency=pricing.currency,
        provider=provider,
        transaction_ref=transaction_ref,
        metadata={"tier": tier, "course_id": str(pricing.course_id)},
    )

    # Initiate with the payment provider via gateway
    gateway_initiate(payment=payment)

    return {
        "payment_id": str(payment.id),
        "transaction_ref": payment.transaction_ref,
        "amount": str(payment.amount),
        "currency": payment.currency,
        "status": payment.status,
    }
