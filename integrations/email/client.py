import logging

from django.conf import settings

logger = logging.getLogger("emails")

try:
    import resend
except ImportError:  # pragma: no cover
    resend = None


class ResendClient:
    """Thin wrapper around the Resend SDK. No business logic here —
    services/notifications call this, not the other way around."""

    @staticmethod
    def send(to: str, subject: str, html: str, from_email: str | None = None) -> dict:
        if resend is None:
            raise RuntimeError("The 'resend' package is not installed")

        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": from_email or settings.RESEND_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        response = resend.Emails.send(params)
        logger.info("Email queued via Resend | to=%s | id=%s", to, response.get("id"))
        return response
