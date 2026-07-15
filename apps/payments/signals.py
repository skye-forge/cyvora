from django.dispatch import Signal

# Fired from Payment.mark_success(). certificates/signals.py listens for
# this — payments has zero knowledge of what a certificate is.
payment_succeeded = Signal()  # providing_args: payment
