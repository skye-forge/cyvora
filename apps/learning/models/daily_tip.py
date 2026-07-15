from django.db import models


class DailyTip(models.Model):
    """A short daily safety tip shown to users."""

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "daily_tips"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
