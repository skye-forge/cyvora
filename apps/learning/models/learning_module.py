from django.db import models

from .zone import Zone


class LearningModule(models.Model):
    """A grouping of lessons within a zone (e.g. "Week 1: Basics")."""

    zone = models.ForeignKey(
        Zone, on_delete=models.CASCADE, related_name="modules"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "learning_modules"
        ordering = ["zone_id", "order"]
        unique_together = [["zone", "title"]]

    def __str__(self):
        return f"{self.zone.title} — {self.title}"
