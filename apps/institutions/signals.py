from django.dispatch import receiver

from apps.payments.signals import payment_succeeded
from shared.enums.certification import PaymentPurpose


@receiver(payment_succeeded)
def activate_license_on_payment_success(sender, payment, **kwargs):
    """
    institutions listens for the same signal certificates listens for,
    filtered to its own purpose. payments has no idea either receiver
    exists — this is the whole point of the decoupled design.
    """
    if payment.purpose != PaymentPurpose.INSTITUTION_LICENSE.value:
        return

    from .services import activate_license

    activate_license(payment=payment)
