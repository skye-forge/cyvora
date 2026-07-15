from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    target_type = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor_label",
            "verb",
            "target_type",
            "target_object_id",
            "target_repr",
            "metadata",
            "ip_address",
            "created_at",
        ]

    def get_target_type(self, obj):
        return obj.target_content_type.model if obj.target_content_type else None
