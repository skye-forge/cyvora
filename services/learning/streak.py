"""Streak tracking service.

Tracks daily learning streaks: if the user completes a lesson today,
increment the streak. If they skip a day, reset to 1.
Uses server-side date so client clock manipulation cannot cheat.
"""

import datetime

from django.utils import timezone

from apps.learning.models import Streak


def record_activity(user) -> None:
    """Call this every time a user completes a lesson (or any learn-worthy action).

    - If last_activity_date is today → no-op (already counted).
    - If last_activity_date is yesterday → increment streak.
    - If last_activity_date is older   → reset streak to 1.
    """
    today = timezone.localdate()

    streak, _ = Streak.objects.get_or_create(user=user)

    if streak.last_activity_date == today:
        # Already recorded today — no-op
        return

    if streak.last_activity_date == today - datetime.timedelta(days=1):
        streak.current_count += 1
    else:
        streak.current_count = 1

    if streak.current_count > streak.longest_count:
        streak.longest_count = streak.current_count

    streak.last_activity_date = today
    streak.save(update_fields=[
        "current_count",
        "longest_count",
        "last_activity_date",
        "updated_at",
    ])

    # Award streak milestone badges
    from services.learning.badges import check_and_award_badge

    milestone_map = {
        7: "7-Day Streak",
        30: "30-Day Streak",
        100: "100-Day Streak",
    }
    if streak.current_count in milestone_map:
        check_and_award_badge(user, milestone_map[streak.current_count])


def get_streak(user) -> Streak:
    streak, _ = Streak.objects.get_or_create(user=user)
    return streak


def is_streak_active(user) -> bool:
    """Returns True if the user has been active today or yesterday."""
    today = timezone.localdate()
    streak = get_streak(user)

    if streak.last_activity_date is None:
        return False

    return streak.last_activity_date >= today - datetime.timedelta(days=1)
