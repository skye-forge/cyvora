from django.dispatch import receiver

from apps.payments.signals import payment_succeeded
from shared.enums.certification import PaymentPurpose


@receiver(payment_succeeded)
def issue_certificate_on_payment_success(sender, payment, **kwargs):
    if payment.purpose != PaymentPurpose.CERTIFICATION.value:
        return

    from .generator import issue_certificate

    issue_certificate(payment=payment)
