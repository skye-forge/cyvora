from rest_framework import serializers

from .models import KYCSubmission, KYCAuditLog


class KYCSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCSubmission
        fields = [
            "id",
            "id_document_type",
            "id_number",
            "full_name",
            "date_of_birth",
            "id_document_front",
            "id_document_back",
            "selfie_photo",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        from .services import create_submission

        user = self.context["request"].user
        return create_submission(user=user, **validated_data)


class KYCSubmissionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    id_document_type_display = serializers.CharField(
        source="get_id_document_type_display", read_only=True
    )

    class Meta:
        model = KYCSubmission
        fields = [
            "id",
            "id_document_type",
            "id_document_type_display",
            "id_number",
            "full_name",
            "date_of_birth",
            "id_document_front",
            "id_document_back",
            "selfie_photo",
            "status",
            "status_display",
            "is_latest",
            "supersedes",
            "rejection_reason",
            "expires_at",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class KYCSubmissionAdminSerializer(KYCSubmissionSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.get_full_name", read_only=True, default=""
    )

    class Meta(KYCSubmissionSerializer.Meta):
        fields = KYCSubmissionSerializer.Meta.fields + [
            "user_email",
            "reviewed_by_name",
        ]


class KYCAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(
        source="actor.get_full_name", read_only=True, default=""
    )

    class Meta:
        model = KYCAuditLog
        fields = ["id", "action", "actor_name", "note", "created_at"]
        read_only_fields = fields


class RejectKYCSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=1000)
