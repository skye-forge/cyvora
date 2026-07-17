"""FR-CERT-02/06: initiate a payment for a certificate tier, with
transparent, admin-configurable pricing."""

from apps.certificates.models import Certificate, CertificatePricing
from apps.payments.models import Payment
from integrations.payments.gateway import initiate as gateway_initiate
from services.certificates.eligibility import is_eligible_for
from shared.exceptions import NotFoundError, ValidationFailedError
from shared.utils import generate_unique_code


def initiate_certificate_checkout(*, user, tier: str, provider: str) -> dict:
    if not is_eligible_for(user, tier):
        raise ValidationFailedError(
            f"User is not yet eligible for the {tier} certificate."
        )

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

    payment = Payment.objects.create(
        user=user,
        amount=pricing.amount,
        currency=pricing.currency,
        provider=provider,
        transaction_ref=transaction_ref,
        metadata={"tier": tier},  # course_id removed — no course concept in this system
    )

    gateway_initiate(payment=payment)

    return {
        "payment_id": str(payment.id),
        "transaction_ref": payment.transaction_ref,
        "amount": str(payment.amount),
        "currency": payment.currency,
        "status": payment.status,
    }
