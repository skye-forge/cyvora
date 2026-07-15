import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base for every model in the system.
    UUID primary keys instead of ints — avoids ID enumeration on
    public-facing endpoints (certificate verification, report refs).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        # ordering = ["-created_at"]
