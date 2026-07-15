"""Badge award logic.

Badges are checked each time a relevant event happens (lesson completion,
streak milestone, XP threshold crossed) and awarded once. This module
centralises all award checks so they aren't scattered across views.
"""

from apps.learning.models import Badge, UserBadge


# ──────────────────────────────────────────────────
# Core award function
# ──────────────────────────────────────────────────

def check_and_award_badge(user, badge_name: str) -> bool:
    """Check if a user has earned a badge and award it if not already owned.

    Returns True if the badge was awarded just now, False if already owned
    or the badge doesn't exist / is inactive.
    """
    try:
        badge = Badge.objects.get(name=badge_name, is_active=True)
    except Badge.DoesNotExist:
        return False

    _, created = UserBadge.objects.get_or_create(user=user, badge=badge)
    if created and badge.xp_bonus > 0:
        user.award_xp(badge.xp_bonus)
    return created


# ──────────────────────────────────────────────────
# Event-driven checks  (called from service layer)
# ──────────────────────────────────────────────────

def check_lesson_milestones(user) -> None:
    """Award badges for number of lessons completed."""
    from apps.learning.models import LessonProgress

    count = LessonProgress.objects.filter(user=user, completed=True).count()
    for milestone, name in [(1, "First Lesson"), (10, "10 Lessons"), (50, "50 Lessons"), (100, "100 Lessons")]:
        if count >= milestone:
            check_and_award_badge(user, name)


def check_xp_milestones(user) -> None:
    """Award badges for XP thresholds."""
    milestones = [
        (100, "100 XP"),
        (500, "500 XP"),
        (1000, "1,000 XP"),
        (5000, "5,000 XP"),
        (10000, "10,000 XP"),
    ]
    for threshold, name in milestones:
        if user.xp_points >= threshold:
            check_and_award_badge(user, name)


def check_zone_completion_badge(user, zone_title: str) -> None:
    """Award badge when a user completes all lessons in a zone."""
    name = f"{zone_title} Complete"
    check_and_award_badge(user, name)


def check_all_zones_complete(user) -> None:
    """Award 'Master Learner' if all published zones are completed."""
    from apps.learning.models import Zone, Lesson
    from apps.learning.selectors import get_zone_completion

    zones = Zone.objects.filter(status="published")
    if not zones:
        return
    all_complete = all(get_zone_completion(user, z) == 100.0 for z in zones)
    if all_complete:
        check_and_award_badge(user, "Master Learner")
