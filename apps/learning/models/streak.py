from django.conf import settings
from django.db import models


class Streak(models.Model):
    """Tracks a user's daily learning streak."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="learning_streak"
    )
    current_count = models.PositiveIntegerField(default=0)
    longest_count = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_streaks"

    def __str__(self):
        return f"{self.user.email} — {self.current_count} day(s)"
