"""XP award logic, centralized here so every XP-granting action
(lesson completion, quiz attempts, daily challenges, etc.) goes
through one place instead of being scattered across apps."""

from apps.learning.models import XPTransaction

LESSON_COMPLETION_XP = 50
QUIZ_PASS_XP = 30
STREAK_BONUS_XP = 10
DAILY_CHALLENGE_XP = 20
BADGE_BONUS_XP = 0  # Defined on the badge itself


def award_xp(user, amount: int, transaction_type: str = "lesson_complete", description: str = "") -> None:
    """Award XP to a user and log the transaction."""
    if amount == 0:
        return

    user.award_xp(amount)

    # Log the transaction
    XPTransaction.objects.create(
        user=user,
        amount=amount,
        transaction_type=transaction_type,
        description=description or f"Awarded {amount} XP",
    )


def award_lesson_completion_xp(user) -> None:
    award_xp(
        user,
        LESSON_COMPLETION_XP,
        transaction_type="lesson_complete",
        description="Lesson completed",
    )


def award_quiz_pass_xp(user) -> None:
    award_xp(
        user,
        QUIZ_PASS_XP,
        transaction_type="quiz_pass",
        description="Quiz passed",
    )


def award_streak_bonus_xp(user, streak_days: int) -> None:
    award_xp(
        user,
        STREAK_BONUS_XP,
        transaction_type="streak_bonus",
        description=f"{streak_days}-day streak bonus",
    )


def award_daily_challenge_xp(user) -> None:
    award_xp(
        user,
        DAILY_CHALLENGE_XP,
        transaction_type="daily_challenge",
        description="Daily challenge completed",
    )


def get_total_xp(user) -> int:
    return user.xp_points
