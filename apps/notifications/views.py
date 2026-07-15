import base64
import hashlib
import hmac
import logging

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from shared.webhook_security import compute_hmac_sha256, constant_time_equals
from .models import EmailLog

logger = logging.getLogger("emails")


class ResendWebhookView(APIView):
    """
    POST /api/v1/webhooks/resend

    Machine-to-machine callback from Resend — intentionally does NOT use
    the standard success/error envelope, since Resend's webhook consumer
    expects its own response shape, not ours.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    EVENT_STATUS_MAP = {
        "email.delivered": "delivered",
        "email.bounced": "bounced",
        "email.complained": "failed",
        "email.failed": "failed",
    }

    def post(self, request, *args, **kwargs):
        if not self._has_valid_signature(request):
            logger.warning("Rejected Resend webhook with invalid signature")
            return Response(
                {"detail": "Invalid webhook signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = request.data.get("type")
        provider_message_id = self._get_provider_message_id(request.data)
        next_status = self.EVENT_STATUS_MAP.get(event_type)

        if not provider_message_id or not next_status:
            logger.info("Ignored Resend webhook event | type=%s", event_type)
            return Response({"status": "ignored"})

        updated = EmailLog.objects.filter(
            provider_message_id=provider_message_id,
        ).update(status=next_status)
        logger.info(
            "Processed Resend webhook | type=%s | message_id=%s | updated=%s",
            event_type, provider_message_id, updated,
        )
        return Response({"status": "processed", "updated": updated})

    def _has_valid_signature(self, request):
        secret = settings.RESEND_WEBHOOK_SECRET
        if not secret:
            return settings.DEBUG

        svix_id = request.headers.get("svix-id")
        svix_timestamp = request.headers.get("svix-timestamp")
        svix_signature = request.headers.get("svix-signature", "")
        if not svix_id or not svix_timestamp or not svix_signature:
            return False

        secret = secret.removeprefix("whsec_")
        try:
            key = base64.b64decode(secret)
        except (ValueError, TypeError):
            logger.exception("Invalid RESEND_WEBHOOK_SECRET format")
            return False

        signed_payload = b".".join([
            svix_id.encode("utf-8"),
            svix_timestamp.encode("utf-8"),
            request.body,
        ])
        digest = hmac.new(key, signed_payload, hashlib.sha256).digest()
        expected = base64.b64encode(digest).decode("utf-8")

        signatures = [
            value.split(",", 1)[-1].strip()
            for value in svix_signature.split(" ")
            if value.strip()
        ]
        return any(hmac.compare_digest(expected.encode("utf-8"), signature.encode("utf-8")) for signature in signatures)

    def _get_provider_message_id(self, payload):
        data = payload.get("data") or {}
        return data.get("email_id") or data.get("id") or data.get("message_id")
