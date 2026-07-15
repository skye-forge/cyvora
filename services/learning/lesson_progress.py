"""Lesson progress service — handles completion marking, progress queries,
and orchestrates side-effects (XP award, streak record, badge checks)."""

from django.utils import timezone

from apps.learning.models import Lesson, LessonProgress
from apps.learning.selectors import get_lesson
from shared.exceptions import ValidationFailedError

from .xp import award_lesson_completion_xp
from .streak import record_activity
from .badges import check_lesson_milestones, check_xp_milestones


def mark_lesson_complete(*, user, lesson_id) -> LessonProgress:
    lesson = get_lesson(lesson_id)

    progress, created = LessonProgress.objects.get_or_create(
        user=user,
        lesson=lesson,
        defaults={"completed": True, "completed_at": timezone.now()},
    )

    if not created and progress.completed:
        raise ValidationFailedError("This lesson has already been completed.")

    if not created:
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save(update_fields=["completed", "completed_at"])

    # Award XP
    award_lesson_completion_xp(user)

    # Record streak
    record_activity(user)

    # Check milestone badges
    check_lesson_milestones(user)
    check_xp_milestones(user)

    return progress


def get_lesson_completion_count(user) -> int:
    return LessonProgress.objects.filter(user=user, completed=True).count()


def get_zone_completion_percentage(user, zone) -> float:
    from apps.learning.models import Lesson

    total = Lesson.objects.filter(module__zone=zone).count()
    if total == 0:
        return 0.0

    completed = LessonProgress.objects.filter(
        user=user,
        lesson__module__zone=zone,
        completed=True,
    ).count()

    return round((completed / total) * 100, 1)


def is_zone_completed(user, zone) -> bool:
    return get_zone_completion_percentage(user, zone) == 100.0
