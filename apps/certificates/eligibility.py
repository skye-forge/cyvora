from shared.exceptions.base import AppException
from shared.constants import CertificateTier

from . import selectors


def check_completion(*, user, course) -> bool:
    """
    A user is eligible once their UserProgress for this course track hits
    100%. Assumes learning.UserProgress has (user, course, percent_complete).
    """
    from learning.models import UserProgress

    progress = UserProgress.objects.filter(user=user, course=course).first()
    return bool(progress and progress.percent_complete >= 100)


def assert_eligible_for_purchase(*, user, course) -> None:
    """
    Raises AppException with a specific, user-facing reason if the user
    can't purchase a certificate for this course right now. Called before
    initiate_certificate_purchase ever touches payments.
    """
    if not check_completion(user=user, course=course):
        raise AppException(
            "You must complete 100% of this course before purchasing a certificate.",
            code="not_eligible",
        )

    if selectors.user_already_certified(user, course):
        raise AppException(
            "You already hold a valid certificate for this course.",
            code="already_certified",
        )


def resolve_tier_for_course(course) -> str:
    """
    Maps a completed course track to a certificate tier. Placeholder
    assumes every course issues a Gold-equivalent until the learning app
    defines how tracks relate to tiers — replace once that's decided.
    """
    return getattr(course, "certificate_tier", CertificateTier.GOLD)
