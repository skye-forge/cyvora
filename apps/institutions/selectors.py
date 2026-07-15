from django.db.models import QuerySet

from .models import Institution, InstitutionMembership, InstitutionLicensePricing
from shared.constants import InstitutionMemberRole


def is_institution_admin(*, user, institution) -> bool:
    return InstitutionMembership.objects.filter(
        institution=institution, user=user, role=InstitutionMemberRole.ADMIN
    ).exists()


def get_active_pricing_for_institution(
    institution: Institution,
) -> InstitutionLicensePricing | None:
    if not institution.subscription_tier:
        return None
    return InstitutionLicensePricing.objects.filter(
        tier=institution.subscription_tier, is_active=True
    ).first()


def get_pricing_by_tier(tier: str) -> InstitutionLicensePricing | None:
    return InstitutionLicensePricing.objects.filter(tier=tier, is_active=True).first()


def get_members(institution: Institution) -> QuerySet[InstitutionMembership]:
    return institution.memberships.select_related("user")


def get_user_institutions(user) -> QuerySet[Institution]:
    return Institution.objects.filter(memberships__user=user)
