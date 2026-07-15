import uuid


def generate_unique_code(prefix: str = "") -> str:
    """Used for certificate codes, referral codes, etc."""
    return f"{prefix}{uuid.uuid4().hex[:10].upper()}"
