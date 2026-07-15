from rest_framework import serializers
from .models import NationalUpdate


class NationalUpdateListSerializer(serializers.ModelSerializer):
    class Meta:
        model = NationalUpdate
        fields = [
            "id",
            "title_en",
            "title_fr",
            "category",
            "urgency_flag",
            "region_scope",
            "published_at",
        ]


class NationalUpdateDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = NationalUpdate
        fields = [
            "id",
            "title_en",
            "title_fr",
            "body_en",
            "body_fr",
            "category",
            "urgency_flag",
            "region_scope",
            "published_at",
        ]


class NationalUpdateAdminSerializer(serializers.ModelSerializer):
    """Used by admin_console for create/edit. published_by/at/push_dispatched are server-set only."""

    class Meta:
        model = NationalUpdate
        fields = [
            "id",
            "title_en",
            "title_fr",
            "body_en",
            "body_fr",
            "category",
            "urgency_flag",
            "region_scope",
            "is_published",
        ]
        read_only_fields = ["id", "is_published"]
