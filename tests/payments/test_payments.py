import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.certificates.models import CertificatePricing
from apps.learning.models import LearningZone, Lesson, LessonProgress
from tests.accounts.factories import UserFactory
from tests.payment_webhook_utils import signed_webhook_request

pytestmark = pytest.mark.django_db


@pytest.fixture
def eligible_client():
    client = APIClient()
    user = UserFactory(email="payer@varnis.cm", password="TestPass123")
    client.force_authenticate(user=user)

    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    lesson = Lesson.objects.create(title="Intro", content="...", zone=zone)
    LessonProgress.objects.create(user=user, lesson=lesson, completed=True)
    CertificatePricing.objects.create(tier="bronze", amount=2500, currency="XAF")

    return client, user


def _webhook_post(provider: str, payload: dict, signature: str = None):
    body, computed_signature = signed_webhook_request(payload)
    headers = {
        "HTTP_X_WEBHOOK_SIGNATURE": (
            signature if signature is not None else computed_signature
        )
    }
    return APIClient().post(
        f"/api/v1/payments/webhook/{provider}",
        data=body,
        content_type="application/json",
        **headers,
    )


def test_checkout_returns_checkout_url_and_pending_status(eligible_client):
    client, _ = eligible_client
    response = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "orange_money"}
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["status"] == "pending"
    assert data["checkout_url"].startswith("https://")
    assert data["amount"] == "2500.00"


def test_payment_status_endpoint_requires_ownership(eligible_client):
    client, user = eligible_client
    checkout = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "card"}
    )
    payment_id = checkout.json()["data"]["id"]

    other_client = APIClient()
    other_client.force_authenticate(
        user=UserFactory(email="other@varnis.cm", password="TestPass123")
    )

    own_response = client.get(f"/api/v1/payments/{payment_id}")
    other_response = other_client.get(f"/api/v1/payments/{payment_id}")

    assert own_response.status_code == 200
    assert other_response.status_code == 404


def test_confirming_unknown_transaction_ref_returns_404(eligible_client):
    response = _webhook_post(
        "momo", {"transaction_ref": "PAY-DOESNOTEXIST", "success": True}
    )
    assert response.status_code == 404


def test_confirming_already_confirmed_payment_is_rejected(eligible_client):
    client, _ = eligible_client
    checkout = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "momo"}
    )
    ref = checkout.json()["data"]["transaction_ref"]

    first = _webhook_post("momo", {"transaction_ref": ref, "success": True})
    second = _webhook_post("momo", {"transaction_ref": ref, "success": True})

    assert first.status_code == 200
    assert second.status_code == 422


def test_webhook_rejects_missing_signature(eligible_client):
    client, _ = eligible_client
    checkout = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "momo"}
    )
    ref = checkout.json()["data"]["transaction_ref"]

    response = APIClient().post(
        "/api/v1/payments/webhook/momo",
        {"transaction_ref": ref, "success": True},
        format="json",
    )

    assert response.status_code == 400


def test_webhook_accepts_valid_signature(eligible_client):
    client, _ = eligible_client
    checkout = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "momo"}
    )
    ref = checkout.json()["data"]["transaction_ref"]

    response = _webhook_post("momo", {"transaction_ref": ref, "success": True})

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "success"


def test_webhook_rejects_wrong_signature(eligible_client):
    client, _ = eligible_client
    checkout = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "momo"}
    )
    ref = checkout.json()["data"]["transaction_ref"]

    response = _webhook_post(
        "momo", {"transaction_ref": ref, "success": True}, signature="0" * 64
    )

    assert response.status_code == 400


@override_settings(PAYMENT_WEBHOOK_SECRETS={"momo": "", "orange_money": "", "card": ""})
def test_webhook_rejected_when_no_secret_configured_outside_debug(eligible_client):
    """Django's test runner always sets DEBUG=False, so this exercises the
    real production failure mode: no secret configured => reject, full stop,
    never silently accept just because it's a lower environment."""
    client, _ = eligible_client
    checkout = client.post(
        "/api/v1/payments/checkout", {"tier": "bronze", "provider": "momo"}
    )
    ref = checkout.json()["data"]["transaction_ref"]

    response = _webhook_post("momo", {"transaction_ref": ref, "success": True})

    assert response.status_code == 400


@override_settings(
    DEBUG=True, PAYMENT_WEBHOOK_SECRETS={"momo": "", "orange_money": "", "card": ""}
)
def test_webhook_dev_bypass_works_when_explicitly_in_debug_mode(rf):
    """Proves the DEBUG-bypass branch itself is correct. Tested directly
    against the view method rather than through a full HTTP request:
    flipping DEBUG mid-test via override_settings breaks Django Debug
    Toolbar (its URL registration happens once at import time), which is
    an artifact of that dev-only middleware, not of the code under test."""
    from apps.payments.views import PaymentWebhookView

    request = rf.post("/api/v1/payments/webhook/momo")
    assert PaymentWebhookView()._has_valid_signature(request, "momo") is True
