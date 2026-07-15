from django.db import models

from shared.enums.learning import PublicationStatus
from shared.models.base import BaseModel


class PublishableModel(BaseModel):
    """
    Base model for entities that go through
    a publishing workflow.
    """

    status = models.CharField(
        max_length=20,
        choices=PublicationStatus.choices,
        default=PublicationStatus.DRAFT,
        db_index=True,
    )

    published_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True
