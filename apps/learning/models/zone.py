from django.db import models
from shared.utils import generate_unique_slug
from shared.enums.learning import (
    DifficultyLevel,
    PublicationStatus,
)
from shared.models import OrderedModel, PublishableModel


class Zone(PublishableModel, OrderedModel):
    """
    Top-level learning category.

    Example:
        - AI Safety
        - Mobile Money Safety
        - Phishing Awareness
        - Digital Citizenship
    """

    title = models.CharField(
        max_length=150, unique=True, help_text="Unique zone title."
    )

    slug = models.SlugField(
        max_length=170,
        unique=True,
        db_index=True,
        editable=False,
    )

    description = models.TextField(
        blank=True,
    )

    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text="Frontend icon identifier (heroicons, lucide, material...).",
    )

    color = models.CharField(
        max_length=7,
        default="#2563EB",
        help_text="Hex color used by frontend.",
    )

    difficulty = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER,
        db_index=True,
    )

    estimated_hours = models.PositiveSmallIntegerField(
        default=0,
        help_text="Estimated hours to complete this learning zone.",
    )

    class Meta:
        db_table = "learning_zones"

        verbose_name = "Learning Zone"

        verbose_name_plural = "Learning Zones"

        ordering = [
            "display_order",
            "title",
        ]

        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["difficulty"]),
            models.Index(fields=["display_order"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(
                model=Zone,
                value=self.title,
            )
        super().save(*args, **kwargs)

    def delete_zone(self):
        """Soft-delete: archive instead of hard-delete."""
        from shared.enums.learning import PublicationStatus
        self.status = PublicationStatus.ARCHIVED
        self.save(update_fields=["status", "updated_at"])
