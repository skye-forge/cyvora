
from rest_framework import serializers
from .models import CommunityPost, CommunityComment


class CommunityCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = CommunityComment
        fields = ["id", "author_name", "content", "created_at"]


class CommunityPostSerializer(serializers.ModelSerializer):
    is_author_verified = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "type",
            "content",
            "media_url",
            "tags",
            "author_name",
            "is_author_verified",
            "likes_count",
            "comments_count",
            "created_at",
        ]

    def get_is_author_verified(self, obj):
        return obj.is_author_verified()

    def get_author_name(self, obj):
        # Alerts and reports made anonymously never expose a name — NFR-03.
        if obj.author is None:
            return None
        return obj.author.full_name


class TipCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000)
    media_url = serializers.URLField(required=False, allow_blank=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=30), required=False
    )


class CommentCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=1000)


class ContentReportSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=1000)


class ModerationDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["approved", "rejected"])
    reason = serializers.CharField(required=False, allow_blank=True)
