from django.conf import settings
from django.db import models

from .lesson import Lesson


class LessonProgress(models.Model):
    """Tracks a user's completion status for each lesson."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress",
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress")
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "lesson_progress"
        unique_together = ("user", "lesson")

    def __str__(self):
        return f"{self.user.email} — {self.lesson.title}: {'✓' if self.completed else '✗'}"
