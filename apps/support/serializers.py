from rest_framework import serializers

from .models import SupportMessage, SupportTicket, TicketCategory


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.UUIDField(source="sender.id", read_only=True, allow_null=True)

    class Meta:
        model = SupportMessage
        fields = [
            "id",
            "ticket",
            "sender_id",
            "sender_role",
            "message",
            "attachment_url",
            "is_ai_generated",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "sender_id", "is_ai_generated", "created_at"]


class SupportTicketSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "user",
            "subject",
            "category",
            "status",
            "auto_handled",
            "assigned_agent",
            "created_at",
            "updated_at",
            "closed_at",
            "last_message",
        ]
        read_only_fields = [
            "id", "user", "status", "auto_handled", "assigned_agent",
            "created_at", "updated_at", "closed_at", "last_message",
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        return SupportMessageSerializer(msg).data if msg else None


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    """Used only for POST /support/tickets/ — the citizen only supplies
    subject/category/first message; everything else is server-assigned."""

    message = serializers.CharField(write_only=True)
    attachment_url = serializers.URLField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = SupportTicket
        fields = ["subject", "category", "message", "attachment_url"]

    def validate_category(self, value):
        valid = [c[0] for c in TicketCategory.choices]
        if value not in valid:
            raise serializers.ValidationError(f"category must be one of {valid}")
        return value


class SupportTicketDetailSerializer(SupportTicketSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta(SupportTicketSerializer.Meta):
        fields = SupportTicketSerializer.Meta.fields + ["messages"]
