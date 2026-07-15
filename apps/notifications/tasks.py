from celery import shared_task
from django.template.loader import render_to_string

from .models import EmailLog


@shared_task(bind=True, max_retries=3, default_retry_backoff=True)
def send_email_task(self, to: str, subject: str, template_name: str, context: dict):
    from integrations.email.resend_client import ResendClient

    html = render_to_string(template_name, context)
    log = EmailLog.objects.create(
        recipient=to, subject=subject, template_name=template_name, status="pending",
    )

    try:
        response = ResendClient.send(to=to, subject=subject, html=html)
        log.provider_message_id = response.get("id")
        log.status = "sent"
        log.save(update_fields=["provider_message_id", "status"])
    except Exception as exc:
        log.status = "failed"
        log.error_message = str(exc)
        log.save(update_fields=["status", "error_message"])
        raise self.retry(exc=exc)
