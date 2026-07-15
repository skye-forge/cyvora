from django.db.models import QuerySet
from django.utils import timezone
from .models import Certificate, CertificatePricing


def get_user_certificates(user) -> QuerySet[Certificate]:
    return Certificate.objects.filter(user=user)


def get_certificate_by_code(cert_code: str) -> Certificate | None:
    return (
        Certificate.objects.filter(cert_code=cert_code)
        .select_related("user")
        .first()
    )


def get_active_pricing(tier: str) -> CertificatePricing | None:
    return CertificatePricing.objects.filter(tier=tier, is_active=True).first()


def user_already_certified(user, tier: str) -> bool:
    return Certificate.objects.filter(
        user=user, tier=tier, expires_at__gt=timezone.now()
    ).exists()
