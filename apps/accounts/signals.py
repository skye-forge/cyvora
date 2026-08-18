"""
Signal handlers for the accounts app.
Kept intentionally thin — anything with real business logic should live
in services.py and be called explicitly, not hidden behind a signal.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User
from .tasks import send_welcome_email  

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def send_welcome_email_on_registration(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        send_welcome_email.delay(user_id=instance.id)
    except Exception:
        # A broker outage must never break registration itself — this is
        # exactly what crashed OTP issuance in production (Aug 2026):
        # this signal fires synchronously inside user.save(), before
        # RegisterView ever regains control to call issue_otp(). Log and
        # move on instead of letting it propagate.
        logger.exception("Could not queue welcome email for user %s", instance.id)
