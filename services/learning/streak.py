"""Streak tracking service. Server-side date so client clock
manipulation cannot cheat."""

import datetime
from django.utils import timezone

from apps.learning.models import Streak
from shared.constants import GamificationConstants


def record_activity(user) -> None:
    today = timezone.localdate()
    streak, _ = Streak.objects.get_or_create(user=user)

    if streak.last_activity_date == today:
        return  # already recorded today

    if streak.last_activity_date == today - datetime.timedelta(days=1):
        streak.current_count += 1
    else:
        streak.current_count = 1

    streak.longest_count = max(streak.longest_count, streak.current_count)
    streak.last_activity_date = today
    streak.save(
        update_fields=[
            "current_count",
            "longest_count",
            "last_activity_date",
            "updated_at",
        ]
    )

    from .xp import award_streak_bonus_xp

    award_streak_bonus_xp(user, streak.current_count)

    if streak.current_count in GamificationConstants.STREAK_MILESTONES:
        from .badges import check_and_award_badge

        check_and_award_badge(user, f"{streak.current_count}-Day Streak")


def get_streak(user) -> Streak:
    streak, _ = Streak.objects.get_or_create(user=user)
    return streak


def is_streak_active(user) -> bool:
    today = timezone.localdate()
    streak = get_streak(user)
    if streak.last_activity_date is None:
        return False
    return streak.last_activity_date >= today - datetime.timedelta(days=1)
