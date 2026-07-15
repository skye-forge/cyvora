import pytest

TEST_WEBHOOK_SECRET = "test-secret"


@pytest.fixture(autouse=True)
def _configure_payment_webhook_secrets(settings):
    """
    Every payment webhook test signs its payload like a real provider
    would (see tests/payment_webhook_utils.py) rather than relying on
    the DEBUG-only bypass in PaymentWebhookView — Django's test runner
    forces DEBUG=False regardless of settings files, which is actually
    the behavior we want: it means an unsigned webhook call fails the
    same way in tests as it would in production, instead of silently
    passing because "well it's just a test."
    """
    settings.PAYMENT_WEBHOOK_SECRETS = {
        "momo": TEST_WEBHOOK_SECRET,
        "orange_money": TEST_WEBHOOK_SECRET,
        "card": TEST_WEBHOOK_SECRET,
    }
