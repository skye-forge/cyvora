"""Learning analytics service.

Provides aggregated completion stats, XP analytics, and zone/module
level insights for the admin dashboard and citizen-facing progress views.
"""

from django.db.models import Count, Q, Avg, Sum

from apps.learning.models import Zone, LearningModule, Lesson, LessonProgress, XPTransaction
from apps.accounts.models import User


# ──────────────────────────────────────────────
# Completion analytics
# ──────────────────────────────────────────────

def get_overall_completion_rate() -> dict:
    """Percentage of all possible lesson completions across all users."""
    total_users = User.objects.filter(is_active=True).count()
    if total_users == 0:
        return {"rate": 0.0, "total_lessons": 0, "total_completed": 0}

    total_lessons = Lesson.objects.count()
    if total_lessons == 0:
        return {"rate": 0.0, "total_lessons": 0, "total_completed": 0}

    total_completed = LessonProgress.objects.filter(completed=True).count()
    possible = total_users * total_lessons
    rate = round((total_completed / possible) * 100, 1) if possible > 0 else 0.0

    return {
        "rate": rate,
        "total_lessons": total_lessons,
        "total_completed": total_completed,
        "total_users": total_users,
    }


def get_user_completion_summary(user) -> dict:
    """Full completion summary for a single user."""
    zones = Zone.objects.filter(status="published")
    zone_data = []
    total_lessons = 0
    total_completed = 0

    for zone in zones:
        zone_lessons = Lesson.objects.filter(module__zone=zone).count()
        zone_completed = LessonProgress.objects.filter(
            user=user, lesson__module__zone=zone, completed=True
        ).count()
        zone_data.append({
            "zone_id": str(zone.id),
            "zone_title": zone.title,
            "total_lessons": zone_lessons,
            "completed": zone_completed,
            "percentage": round((zone_completed / zone_lessons) * 100, 1) if zone_lessons > 0 else 0.0,
        })
        total_lessons += zone_lessons
        total_completed += zone_completed

    return {
        "total_lessons": total_lessons,
        "total_completed": total_completed,
        "overall_percentage": round((total_completed / total_lessons) * 100, 1) if total_lessons > 0 else 0.0,
        "zones": zone_data,
    }


# ──────────────────────────────────────────────
# XP analytics
# ──────────────────────────────────────────────

def get_user_xp_summary(user) -> dict:
    """XP summary for a single user."""
    xp_data = XPTransaction.objects.filter(user=user).aggregate(
        total_xp=Sum("amount"),
        transaction_count=Count("id"),
    )
    return {
        "total_xp": user.xp_points,
        "level": user.level,
        "transaction_count": xp_data["transaction_count"] or 0,
    }


def get_xp_distribution() -> dict:
    """Average XP stats across all active users."""
    stats = User.objects.filter(is_active=True).aggregate(
        avg_xp=Avg("xp_points"),
        avg_level=Avg("level"),
        total_xp=Sum("xp_points"),
        user_count=Count("id"),
    )
    return {
        "average_xp": round(stats["avg_xp"] or 0, 1),
        "average_level": round(stats["avg_level"] or 0, 1),
        "total_xp_awarded": stats["total_xp"] or 0,
        "active_users": stats["user_count"] or 0,
    }


# ──────────────────────────────────────────────
# Zone analytics
# ──────────────────────────────────────────────

def get_zone_analytics(zone_id) -> dict:
    """Analytics for a specific zone."""
    from django.db.models import Count

    zone = Zone.objects.get(id=zone_id)
    modules = LearningModule.objects.filter(zone=zone).annotate(
        lesson_count=Count("lessons"),
    )

    total_lessons = sum(m.lesson_count for m in modules)
    total_completed = LessonProgress.objects.filter(
        lesson__module__zone=zone, completed=True
    ).count()

    return {
        "zone_title": zone.title,
        "total_modules": modules.count(),
        "total_lessons": total_lessons,
        "total_completions": total_completed,
    }


# ──────────────────────────────────────────────
# Leaderboard analytics (admin dashboard)
# ──────────────────────────────────────────────

def get_leaderboard_stats() -> dict:
    """Admin dashboard overview stats for leaderboard."""
    from apps.learning.selectors import get_top_learners

    top = get_top_learners(limit=10)
    return {
        "top_learners": [
            {"name": u.name, "xp_points": u.xp_points, "level": u.level}
            for u in top
        ],
        "total_learners": User.objects.filter(is_active=True, xp_points__gt=0).count(),
    }
