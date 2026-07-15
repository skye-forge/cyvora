from shared.exceptions.base import AppException

from . import selectors


def assert_admin_of(*, user, institution) -> None:
    if not selectors.is_institution_admin(user=user, institution=institution):
        raise AppException(
            "Only an admin of this institution can perform this action.",
            code="not_institution_admin",
        )


def assert_seat_available(*, institution) -> None:
    from .selectors import get_active_pricing_for_institution

    pricing = get_active_pricing_for_institution(institution)
    if pricing is None:
        return  # no license yet — enrollment blocked elsewhere, not here

    current_count = institution.memberships.count()
    if current_count >= pricing.seat_limit:
        raise AppException(
            f"Seat limit reached for this institution's {pricing.tier} plan.",
            code="seat_limit_reached",
        )
