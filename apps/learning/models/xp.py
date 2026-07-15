from django.conf import settings
from django.db import models


class XPTransaction(models.Model):
    """Immutable log of every XP award/deduction for auditing."""

    TRANSACTION_TYPES = [
        ("lesson_complete", "Lesson Completed"),
        ("quiz_pass", "Quiz Passed"),
        ("streak_bonus", "Streak Bonus"),
        ("daily_challenge", "Daily Challenge"),
        ("badge_award", "Badge Award"),
        ("correction", "Correction"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="xp_transactions"
    )
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "xp_transactions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} {self.transaction_type} {self.amount:+d}"
