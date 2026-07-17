from django.db import models
from django.utils import timezone

from shared.enums.learning import PublicationStatus
from shared.models.base import BaseModel


class PublishableModel(BaseModel):
    """
    Abstract base for admin-authored content that goes through a
    draft -> published -> archived lifecycle (Zone, and any future
    content type that needs the same gate). Inherits id/created_at/
    updated_at from BaseModel rather than redefining them.
    """

    status = models.CharField(
        max_length=20,
        choices=PublicationStatus.choices,
        default=PublicationStatus.DRAFT,
        db_index=True,
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def publish(self):
        self.status = PublicationStatus.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "updated_at"])

    def archive(self):
        self.status = PublicationStatus.ARCHIVED
        self.save(update_fields=["status", "updated_at"])
