from rest_framework import serializers
from .models import LegalTopic, LegalArticle

DISCLAIMER_TEXT = (
    "This content is informational and summarized. "
    "It does not constitute legal advice."
)


class LegalTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalTopic
        fields = ["id", "name", "slug", "description", "order"]


class LegalArticleListSerializer(serializers.ModelSerializer):
    topic = LegalTopicSerializer(read_only=True)

    class Meta:
        model = LegalArticle
        fields = [
            "id",
            "topic",
            "title_en",
            "title_fr",
            "source_reference",
            "updated_at",
        ]


class LegalArticleDetailSerializer(serializers.ModelSerializer):
    topic = LegalTopicSerializer(read_only=True)
    disclaimer = serializers.SerializerMethodField()
    official_source_url = serializers.URLField(source="official_url", read_only=True)
    last_updated = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = LegalArticle
        fields = [
            "id",
            "topic",
            "title_en",
            "title_fr",
            "summary_body_en",
            "summary_body_fr",
            "source_reference",
            "official_source_url",
            "last_updated",
            "disclaimer",
        ]

    def get_disclaimer(self, obj):
        return DISCLAIMER_TEXT


class LegalArticleAdminSerializer(serializers.ModelSerializer):
    """Used by admin_console for create/edit. last_updated_by/at are server-set, never client-supplied."""

    class Meta:
        model = LegalArticle
        fields = [
            "id",
            "topic",
            "title_en",
            "title_fr",
            "summary_body_en",
            "summary_body_fr",
            "source_reference",
            "official_url",
            "is_published",
            "related_lessons",
            "related_incident_categories",
        ]
        read_only_fields = ["id"]
