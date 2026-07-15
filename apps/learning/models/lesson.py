from django.db import models

from .learning_module import LearningModule


class Lesson(models.Model):
    """A single lesson with educational content."""

    module = models.ForeignKey(
        LearningModule, on_delete=models.CASCADE, related_name="lessons"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    order = models.PositiveSmallIntegerField(default=1)
    duration_minutes = models.PositiveSmallIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lessons"
        ordering = ["module_id", "order"]

    def __str__(self):
        return self.title


class LessonPart(models.Model):
    """A sub-section within a lesson (text, quiz, video embed, etc.)."""

    PART_TYPES = [
        ("text", "Text"),
        ("quiz", "Quiz"),
        ("video", "Video"),
        ("interactive", "Interactive"),
    ]

    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="parts"
    )
    part_type = models.CharField(max_length=20, choices=PART_TYPES, default="text")
    title = models.CharField(max_length=255, blank=True)
    content = models.JSONField(default=dict, blank=True)
    order = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lesson_parts"
        ordering = ["lesson_id", "order"]

    def __str__(self):
        return f"{self.lesson.title} — Part {self.order}"
