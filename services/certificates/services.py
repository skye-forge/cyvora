"""Certificate issuance service — handles the business logic of issuing
a certificate after payment success."""

from django.utils import timezone

from apps.certificates.models import Certificate
from shared.exceptions import ValidationFailedError
from shared.utils.codes import generate_unique_code

from .eligibility import is_eligible_for
from .generator import issue_certificate


def issue_certificate_for_payment(*, user, tier: str, payment) -> Certificate:
    """
    Issue a certificate after payment has been confirmed.
    Called from services.payments.confirmation.confirm_payment().
    """
    cert = issue_certificate(user=user, tier=tier)
    cert.payment = payment
    cert.save(update_fields=["payment"])
    return cert
