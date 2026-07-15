from apps.certificates.models import Certificate
from apps.certificates.selectors import get_certificate_by_code


def verify_certificate(cert_code: str) -> Certificate:
    """Used by the public QR-scan verification endpoint. Raises
    NotFoundError (via the selector) if the code doesn't exist."""
    return get_certificate_by_code(cert_code)
