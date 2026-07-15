"""Payment selectors — read queries for the payments domain."""

from apps.payments.models import Payment
from shared.exceptions import NotFoundError


def get_payment_for_user(payment_id, user) -> Payment:
    try:
        return Payment.objects.get(id=payment_id, user=user)
    except Payment.DoesNotExist:
        raise NotFoundError("Payment not found.")


def get_payment_by_transaction_ref(transaction_ref: str) -> Payment:
    try:
        return Payment.objects.get(transaction_ref=transaction_ref)
    except Payment.DoesNotExist:
        raise NotFoundError("Payment not found.")
