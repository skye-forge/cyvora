from django.shortcuts import get_object_or_404

from apps.learning.models import Zone, LearningModule, Lesson, LessonPart, LessonProgress, DailyTip
from shared.enums.learning import PublicationStatus


# ──────────────────────────────────────────────
# Zone selectors
# ──────────────────────────────────────────────

def get_all_zones():
    """Every zone ordered for the admin console."""
    return Zone.objects.order_by("display_order", "title")


def get_published_zones():
    """Only published zones for citizens."""
    return Zone.objects.filter(
        status=PublicationStatus.PUBLISHED,
    ).order_by("display_order", "title")


def get_zone_by_id(zone_id):
    """Retrieve a zone by UUID."""
    return get_object_or_404(Zone, id=zone_id)


def get_zone_by_slug(slug):
    """Retrieve a published zone by slug."""
    return get_object_or_404(
        Zone, slug=slug, status=PublicationStatus.PUBLISHED,
    )


def list_zones():
    """List all zones (for the learning API views)."""
    return get_published_zones()


# ──────────────────────────────────────────────
# LearningModule selectors
# ──────────────────────────────────────────────

def list_modules(zone_id):
    """List modules for a zone."""
    return LearningModule.objects.filter(zone_id=zone_id).order_by("order")


def get_module(module_id):
    """Get a single module by ID."""
    return get_object_or_404(LearningModule, id=module_id)


# ──────────────────────────────────────────────
# Lesson selectors
# ──────────────────────────────────────────────

def list_lessons(module_id):
    """List lessons for a module."""
    return Lesson.objects.filter(module_id=module_id).order_by("order")


def get_lesson(lesson_id):
    """Get a single lesson by ID."""
    return get_object_or_404(Lesson, id=lesson_id)


# ──────────────────────────────────────────────
# LessonPart selectors
# ──────────────────────────────────────────────

def list_lesson_parts(lesson_id):
    """List lesson parts for a lesson."""
    return LessonPart.objects.filter(lesson_id=lesson_id).order_by("order")


# ──────────────────────────────────────────────
# Progress selectors
# ──────────────────────────────────────────────

def get_user_progress(user):
    """Get all lesson progress records for a user."""
    return LessonProgress.objects.filter(user=user).select_related("lesson")


def get_lesson_progress(user, lesson):
    """Get progress for a specific lesson."""
    return LessonProgress.objects.filter(user=user, lesson=lesson).first()


def get_zone_completion(user, zone):
    """Calculate completion percentage for a zone."""
    lessons = Lesson.objects.filter(module__zone=zone).count()
    if lessons == 0:
        return 0.0
    completed = LessonProgress.objects.filter(
        user=user, lesson__module__zone=zone, completed=True
    ).count()
    return round((completed / lessons) * 100, 1)


def get_module_completion(user, module):
    """Calculate completion percentage for a module."""
    lessons = Lesson.objects.filter(module=module).count()
    if lessons == 0:
        return 0.0
    completed = LessonProgress.objects.filter(
        user=user, lesson__module=module, completed=True
    ).count()
    return round((completed / lessons) * 100, 1)


# ──────────────────────────────────────────────
# Leaderboard selectors
# ──────────────────────────────────────────────

def get_top_learners(limit=50):
    """Get top learners by XP points."""
    from apps.accounts.models import User
    return User.objects.filter(is_active=True).order_by("-xp_points", "-level")[:limit]


def get_user_ranking(user):
    """Get user's rank and percentile."""
    from apps.accounts.models import User
    total_active = User.objects.filter(is_active=True).count()
    if total_active == 0:
        return {"rank": 0, "total": 0, "percentile": 0.0}

    above = User.objects.filter(
        is_active=True, xp_points__gt=user.xp_points
    ).count()
    rank = above + 1
    percentile = round(((total_active - rank) / total_active) * 100, 1)
    return {"rank": rank, "total": total_active, "percentile": percentile}


# ──────────────────────────────────────────────
# DailyTip selectors
# ──────────────────────────────────────────────

def get_daily_tip():
    """Get an active daily tip, rotated."""
    import datetime
    today = datetime.date.today()
    tip_count = DailyTip.objects.filter(is_active=True).count()
    if tip_count == 0:
        return None
    # Use day-of-year to rotate tips
    day_of_year = today.timetuple().tm_yday
    offset = day_of_year % tip_count
    return DailyTip.objects.filter(is_active=True).order_by("created_at")[offset]
