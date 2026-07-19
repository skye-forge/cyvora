import base64
import hashlib
import hmac

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.notifications.admin import EmailLogAdmin
from apps.notifications.models import EmailLog

pytestmark = pytest.mark.django_db


def test_email_log_admin_uses_existing_model_fields():
    fields = [
        *EmailLogAdmin.list_display,
        *EmailLogAdmin.search_fields,
        *EmailLogAdmin.readonly_fields,
    ]

    for field in fields:
        assert hasattr(
            EmailLog, field
        ), f"EmailLogAdmin references unknown field {field}"


def _build_svix_headers(body: bytes, secret_raw: bytes = b"test-secret"):
    svix_id = "msg_123"
    svix_timestamp = "1720000000"
    signed_payload = b".".join([svix_id.encode(), svix_timestamp.encode(), body])
    digest = hmac.new(secret_raw, signed_payload, hashlib.sha256).digest()
    signature = base64.b64encode(digest).decode()
    return {
        "HTTP_SVIX_ID": svix_id,
        "HTTP_SVIX_TIMESTAMP": svix_timestamp,
        "HTTP_SVIX_SIGNATURE": f"v1,{signature}",
    }


@override_settings(
    DEBUG=False,
    RESEND_WEBHOOK_SECRET="whsec_" + base64.b64encode(b"test-secret").decode(),
)
def test_resend_webhook_updates_email_log_status():
    log = EmailLog.objects.create(
        recipient="student@varnis.cm",
        subject="Welcome",
        provider_message_id="email_123",
        status="sent",
    )
    body = b'{"type":"email.delivered","data":{"email_id":"email_123"}}'

    response = APIClient().post(
        "/api/v1/webhooks/resend",
        data=body,
        content_type="application/json",
        **_build_svix_headers(body),
    )

    log.refresh_from_db()
    assert response.status_code == 200
    assert response.data == {"status": "processed", "updated": 1}
    assert log.status == "delivered"


@override_settings(
    DEBUG=False,
    RESEND_WEBHOOK_SECRET="whsec_" + base64.b64encode(b"test-secret").decode(),
)
def test_resend_webhook_rejects_invalid_signature():
    body = b'{"type":"email.delivered","data":{"email_id":"email_123"}}'

    response = APIClient().post(
        "/api/v1/webhooks/resend",
        data=body,
        content_type="application/json",
        HTTP_SVIX_ID="msg_123",
        HTTP_SVIX_TIMESTAMP="1720000000",
        HTTP_SVIX_SIGNATURE="v1,invalid",
    )

    assert response.status_code == 400


def test_health_check_is_public():
    response = APIClient().get("/api/v1/health")

    assert response.status_code == 200
    assert response.data == {"status": "ok"}
