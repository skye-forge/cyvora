from django.conf import settings
from django.db import models


class Badge(models.Model):
    """Awards earned by users for completing milestones."""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="CSS class or icon name")
    xp_bonus = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "badges"

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """Junction table recording which users earned which badges."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges"
    )
    badge = models.ForeignKey(
        Badge, on_delete=models.CASCADE, related_name="awarded_to"
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_badges"
        unique_together = ("user", "badge")

    def __str__(self):
        return f"{self.user.email} — {self.badge.name}"
