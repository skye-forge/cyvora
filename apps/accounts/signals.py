"""
Signal handlers for the accounts app.
Kept intentionally thin — anything with real business logic should live
in services.py and be called explicitly, not hidden behind a signal.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def send_welcome_email_on_registration(sender, instance: User, created, **kwargs):
    if created:
        from .tasks import send_welcome_email
        send_welcome_email.delay(user_id=instance.id)
