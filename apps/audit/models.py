from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from shared.models.base import BaseModel


class AuditLog(BaseModel):
    """
    Immutable record of a sensitive action. Never updated or deleted
    after creation — enforced in admin.py and by omitting update/delete
    endpoints entirely.
    """

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
    )
    actor_label = models.CharField(max_length=255, blank=True)
    # Denormalized snapshot of the actor's identity (email/name) at the time
    # of the action. If the user account is later deleted, actor FK becomes
    # NULL but this field preserves "who did it" for the audit trail.

    verb = models.CharField(max_length=100, db_index=True)
    # e.g. "incident_report.approved", "legal_article.published"

    # Generic FK so a single table can log actions against any model
    # (IncidentReport, LegalArticle, NationalUpdate, Certificate, ...)
    target_content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    target_object_id = models.CharField(max_length=64, null=True, blank=True)
    target = GenericForeignKey("target_content_type", "target_object_id")
    target_repr = models.CharField(max_length=255, blank=True)
    # Denormalized str(target) at log time — survives target deletion too.

    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["verb", "-created_at"]),
            models.Index(fields=["target_content_type", "target_object_id"]),
            models.Index(fields=["actor", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.actor_label or 'system'} · {self.verb} · {self.created_at:%Y-%m-%d %H:%M}"
