
from celery import shared_task


@shared_task
def generate_certificate_assets(certificate_id: str):
    """
    Generates the QR code + PDF and attaches both to the Certificate row.
    Run async — rendering shouldn't block the payment-webhook response.
    """
    from .models import Certificate
    from .generator import attach_assets

    try:
        certificate = Certificate.objects.get(id=certificate_id)
    except Certificate.DoesNotExist:
        return

    attach_assets(certificate=certificate)
