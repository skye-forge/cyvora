from django.utils import timezone

from shared.exceptions.base import NotFoundError
from shared.mixins.audit_loggable import log_audit_action
from shared.utils.reference_codes import generate_unique_reference_code
from shared.enums.certification import PaymentPurpose

from .models import Certificate, CERTIFICATE_VALIDITY_DAYS
from . import selectors
from services.certificates.eligibility import is_eligible_for


# ---------- Purchase initiation (FR-CERT-02, FR-CERT-06) ----------

def initiate_certificate_purchase(*, user, tier: str, provider: str) -> dict:
    if not is_eligible_for(user, tier):
        raise NotFoundError(
            f"User is not eligible for the {tier} certificate tier."
        )

    from apps.certificates.models import CertificatePricing

    pricing = CertificatePricing.objects.filter(tier=tier, is_active=True).first()
    if pricing is None:
        raise NotFoundError(
            f"Certificate pricing has not been configured for {tier}."
        )

    from apps.payments.models import Payment
    from shared.utils.codes import generate_unique_code

    transaction_ref = generate_unique_code(prefix="PAY-")

    payment = Payment.objects.create(
        user=user,
        purpose=PaymentPurpose.CERTIFICATION.value,
        amount=pricing.amount,
        currency=pricing.currency,
        provider=provider,
        transaction_ref=transaction_ref,
        metadata={"tier": tier},
    )

    return {
        "payment_id": str(payment.id),
        "transaction_ref": payment.transaction_ref,
        "amount": str(pricing.amount),
        "currency": pricing.currency,
        "status": payment.status,
    }


# ---------- Issuance (FR-CERT-03) — triggered by payment_succeeded signal ----------

def issue_certificate(*, payment) -> Certificate:
    tier = payment.metadata.get("tier", "bronze")

    cert_code = generate_unique_reference_code(
        "CERT", Certificate, field_name="cert_code", length=10
    )

    certificate = Certificate.objects.create(
        user=payment.user,
        payment=payment,
        tier=tier,
        cert_code=cert_code,
        expires_at=timezone.now() + timezone.timedelta(days=CERTIFICATE_VALIDITY_DAYS),
    )

    log_audit_action(
        payment.user,
        "certificate.issued",
        certificate,
        {
            "tier": tier,
            "payment_ref": payment.transaction_ref,
        },
    )

    from .tasks import generate_certificate_assets

    generate_certificate_assets.delay(str(certificate.id))

    return certificate


# ---------- Verification (FR-CERT-05) ----------

def verify_certificate(*, cert_code: str) -> dict:
    certificate = selectors.get_certificate_by_code(cert_code)
    if certificate is None:
        return {"valid": False, "reason": "not_found"}

    return {
        "valid": certificate.is_valid(),
        "holder_name": certificate.user.name,
        "tier": certificate.tier,
        "issued_at": certificate.issued_at,
        "expires_at": certificate.expires_at,
    }
