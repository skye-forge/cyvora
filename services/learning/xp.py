
"""XP award logic, centralized here so every XP-granting action
(lesson completion, streak, badges, etc.) goes through one place.
Point values come from shared.constants.GamificationConstants — the
SRS Appendix 7.2 numbers — not redefined here."""

from apps.learning.models import XPTransaction
from shared.constants import GamificationConstants


def award_xp(
    user, amount: int, transaction_type: str = "lesson_complete", description: str = ""
) -> None:
    if amount == 0:
        return

    user.award_xp(amount)

    XPTransaction.objects.create(
        user=user,
        amount=amount,
        transaction_type=transaction_type,
        description=description or f"Awarded {amount} XP",
    )


def award_lesson_completion_xp(user) -> None:
    award_xp(
        user,
        GamificationConstants.POINTS_LESSON_COMPLETED,
        transaction_type="lesson_complete",
        description="Lesson completed",
    )


def award_quiz_pass_xp(user) -> None:
    award_xp(
        user,
        GamificationConstants.POINTS_QUIZ_PASSED,
        transaction_type="quiz_pass",
        description="Quiz passed",
    )


def award_streak_bonus_xp(user, streak_days: int) -> None:
    award_xp(
        user,
        GamificationConstants.POINTS_STREAK_DAY,
        transaction_type="streak_bonus",
        description=f"{streak_days}-day streak bonus",
    )


def award_incident_approved_xp(user) -> None:
    """Appendix 7.2: verified incident report approved: +25 points. Not previously wired anywhere."""
    award_xp(
        user,
        GamificationConstants.POINTS_INCIDENT_REPORT_APPROVED,
        transaction_type="incident_approved",
        description="Incident report approved",
    )


def get_total_xp(user) -> int:
    return user.xp_points
