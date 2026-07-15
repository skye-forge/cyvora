from django.db import models
from django.conf import settings

from shared.models.base import BaseModel
from shared.models.bilingual import BilingualContentMixin


class LegalTopic(BaseModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class LegalArticle(BaseModel, BilingualContentMixin):
    topic = models.ForeignKey(
        LegalTopic, on_delete=models.CASCADE, related_name="articles"
    )

    title_en = models.CharField(max_length=255)
    title_fr = models.CharField(max_length=255)
    summary_body_en = models.TextField()
    summary_body_fr = models.TextField()

    source_reference = models.CharField(
        max_length=255
    )  # e.g. "Law No. 2010/012, Art. 12"
    official_url = models.URLField(blank=True)

    is_published = models.BooleanField(default=False)  # FR-LAW-06 draft/publish gate
    last_updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="legal_edits",
    )

    related_lessons = models.ManyToManyField(
        "learning.Lesson", blank=True, related_name="related_legal_articles"
    )
    related_incident_categories = models.JSONField(default=list, blank=True)
    # stored as a plain list of category codes (e.g. ["phishing", "scam_call"])
    # rather than an FK table, since incident categories are a fixed enum —
    # avoids a needless join table for a small closed set.

    class Meta:
        ordering = ["topic__order", "title_en"]
        indexes = [
            models.Index(fields=["is_published"]),
        ]

    def __str__(self):
        return self.title_en
