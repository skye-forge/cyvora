
"""Shared by tests/payments/ and tests/certificates/ (which drives
payments indirectly through the checkout → webhook → certificate flow).
Kept as a plain module, not a fixture, since it's a pure data helper
used inside test bodies with varying payloads, not test setup/teardown."""
import hashlib
import hmac
import json

from tests.conftest import TEST_WEBHOOK_SECRET


def signed_webhook_request(payload: dict, secret: str = TEST_WEBHOOK_SECRET) -> tuple[bytes, str]:
    """Returns (raw_body, hex_signature) exactly as a real provider
    would send them — the webhook view verifies the signature over the
    raw body, so json.dumps must happen once here, not re-serialized
    differently by the test client."""
    body = json.dumps(payload).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return body, signature