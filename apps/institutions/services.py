from django.utils import timezone

from shared.exceptions.base import AppException, NotFoundError
from shared.mixins.audit_loggable import log_audit_action
from shared.enums.certification import PaymentPurpose
from shared.constants import InstitutionMemberRole

from .models import Institution, InstitutionMembership, LICENSE_VALIDITY_DAYS
from . import selectors, eligibility

# ---------- Registration ----------


def register_institution(
    *, actor, name: str, type_: str, region: str, logo_url: str = ""
) -> Institution:
    """
    Creates the Institution unpaid/inactive (subscription_tier=None) and
    makes the registering user its first admin. It only becomes active
    once a license payment succeeds (see activate_license below).
    """
    institution = Institution.objects.create(
        name=name, type=type_, region=region, logo_url=logo_url, registered_by=actor
    )
    InstitutionMembership.objects.create(
        institution=institution, user=actor, role=InstitutionMemberRole.ADMIN
    )

    log_audit_action(
        actor, "institution.registered", institution, {"name": name, "type": type_}
    )
    return institution


# ---------- Licensing purchase (payments integration) ----------


def initiate_license_purchase(
    *, actor, institution: Institution, tier: str, provider: str
) -> dict:
    eligibility.assert_admin_of(user=actor, institution=institution)

    pricing = selectors.get_pricing_by_tier(tier)
    if pricing is None:
        raise NotFoundError(f"No active pricing configured for tier '{tier}'.")

    from apps.payments.services import initiate_payment

    result = initiate_payment(
        user=actor,
        purpose=PaymentPurpose.INSTITUTION_LICENSE.value,
        amount=pricing.amount,
        provider=provider,
        metadata={"institution_id": str(institution.id), "tier": tier},
    )

    return {
        **result,
        "amount": str(pricing.amount),
        "currency": pricing.currency,
        "seat_limit": pricing.seat_limit,
    }


def activate_license(*, payment) -> Institution:
    """
    Called by institutions/signals.py when payment_succeeded fires with
    purpose=institution_license. Extends expires_at from *now* rather
    than stacking onto a possibly-already-expired date — a renewal
    always buys a fresh LICENSE_VALIDITY_DAYS window from the moment
    payment clears, not from the old expiry.
    """
    institution_id = payment.metadata.get("institution_id")
    tier = payment.metadata.get("tier")

    institution = Institution.objects.get(id=institution_id)
    institution.subscription_tier = tier
    institution.expires_at = timezone.now() + timezone.timedelta(
        days=LICENSE_VALIDITY_DAYS
    )
    institution.save(update_fields=["subscription_tier", "expires_at", "updated_at"])

    log_audit_action(
        institution.registered_by,
        "institution.license_activated",
        institution,
        {
            "tier": tier,
            "payment_ref": payment.transaction_ref,
            "expires_at": str(institution.expires_at),
        },
    )

    return institution


# ---------- Enrollment ----------


def enroll_user(
    *,
    actor,
    institution: Institution,
    target_user,
    role: str = InstitutionMemberRole.MEMBER,
) -> InstitutionMembership:
    eligibility.assert_admin_of(user=actor, institution=institution)

    if not institution.is_active():
        raise AppException(
            "This institution's license is inactive or expired.",
            code="license_inactive",
        )

    eligibility.assert_seat_available(institution=institution)

    membership, created = InstitutionMembership.objects.get_or_create(
        institution=institution, user=target_user, defaults={"role": role}
    )
    if created:
        log_audit_action(
            actor,
            "institution.user_enrolled",
            institution,
            {"user_id": str(target_user.id)},
        )

    return membership


def get_institution_progress(*, institution: Institution) -> dict:
    """
    Aggregates learning progress across all enrolled members —
    for the institution admin dashboard.
    """
    from learning.models import UserProgress

    member_ids = selectors.get_members(institution).values_list("user_id", flat=True)
    progress_qs = UserProgress.objects.filter(user_id__in=member_ids)

    total = progress_qs.count()
    completed = progress_qs.filter(percent_complete=100).count()

    return {
        "total_members": member_ids.count(),
        "total_course_enrollments": total,
        "completed_course_enrollments": completed,
        "completion_rate": round((completed / total) * 100, 1) if total else 0,
    }
