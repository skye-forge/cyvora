from decimal import Decimal

from shared.exceptions.base import AppException, NotFoundError
from shared.mixins.audit_loggable import log_audit_action
from integrations.payments import gateway

from .models import Payment


def initiate_payment(
    *, user, purpose: str, amount: Decimal, provider: str, metadata: dict | None = None
) -> dict:
    payment = Payment.objects.create(
        user=user,
        purpose=purpose,
        amount=amount,
        provider=provider,
        metadata=metadata or {},
    )

    gateway_response = gateway.initiate(payment=payment)
    payment.provider_reference = gateway_response.get("provider_reference", "")
    payment.save(update_fields=["provider_reference", "updated_at"])

    log_audit_action(
        user, "payment.initiated", payment, {"purpose": purpose, "amount": str(amount)}
    )

    return {
        "transaction_ref": payment.transaction_ref,
        "status": payment.status,
        **{k: v for k, v in gateway_response.items() if k != "provider_reference"},
    }


def handle_webhook(
    *, provider: str, payload: dict, raw_body: bytes, signature: str
) -> Payment:
    """
    Verifies the webhook signature using your existing webhook_security
    helper, then updates the matching Payment and fires mark_success/
    mark_failed — which in turn fires payment_succeeded for certificates
    to pick up.

    Adjust the verify_webhook_signature import/call to match your actual
    shared/webhook_security.py signature — this assumes a
    (raw_body, signature, provider) -> bool contract.
    """
    from shared.webhook_security import verify_webhook_signature

    if not verify_webhook_signature(
        raw_body=raw_body, signature=signature, provider=provider
    ):
        raise AppException("Invalid webhook signature.", code="invalid_signature")

    parsed = gateway.parse_webhook(provider=provider, payload=payload)
    provider_reference = parsed["provider_reference"]

    try:
        payment = Payment.objects.get(
            provider_reference=provider_reference, provider=provider
        )
    except Payment.DoesNotExist:
        raise NotFoundError(
            f"No payment found for provider_reference={provider_reference}"
        )

    if payment.status != "pending":
        return payment  # already processed — webhook retried, no-op

    if parsed["status"] == "success":
        payment.mark_success(provider_reference=provider_reference)
        log_audit_action(None, "payment.succeeded", payment, {"provider": provider})
    else:
        payment.mark_failed()
        log_audit_action(None, "payment.failed", payment, {"provider": provider})

    return payment
