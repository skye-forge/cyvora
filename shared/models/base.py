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


class AppException(Exception):
    """Base exception for all application-level errors."""

    def __init__(self, message: str, code: str = "error", status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)
