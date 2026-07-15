"""
Shared low-level HMAC verification primitive. Individual webhook
consumers (Resend's Svix-style id.timestamp.body envelope, a payment
provider's plain raw-body-plus-secret scheme, etc.) differ enough in
envelope format that unifying the whole verification flow would force
an awkward abstraction — but the actual crypto (compute an HMAC-SHA256
digest, compare it in constant time) is identical everywhere, so it
lives here once instead of being reimplemented per webhook view.
"""

import hashlib
import hmac


def compute_hmac_sha256(secret: bytes, payload: bytes) -> bytes:
    return hmac.new(secret, payload, hashlib.sha256).digest()


def constant_time_equals(a: bytes, b: bytes) -> bool:
    return hmac.compare_digest(a, b)
