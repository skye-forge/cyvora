from rest_framework import serializers

from .models import PaymentConfiguration, PaymentSubmission, PaymentSubmissionStatus


class PaymentConfigurationPublicSerializer(serializers.ModelSerializer):
    """What Flutter receives when asking for the active account for a method."""

    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )

    class Meta:
        model = PaymentConfiguration
        fields = [
            "payment_method",
            "payment_method_display",
            "account_name",
            "account_number",
            "reference_code",
            "instructions",
        ]


class PaymentConfigurationAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentConfiguration
        fields = [
            "id",
            "payment_method",
            "label",
            "account_name",
            "account_number",
            "reference_code",
            "instructions",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PaymentSubmissionCreateSerializer(serializers.ModelSerializer):
    """User creates a submission and attaches proof in one step."""

    class Meta:
        model = PaymentSubmission
        fields = [
            "id",
            "purpose",
            "related_object_id",
            "payment_configuration",
            "payer_name",
            "payer_phone",
            "amount_expected",
            "amount_declared",
            "transaction_ref",
            "proof_file",
        ]
        read_only_fields = ["id"]

    def validate_purpose(self, value):
        from .models import PaymentPurpose

        if value not in PaymentPurpose.values:
            raise serializers.ValidationError("Unsupported payment purpose.")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        submission = super().create(validated_data)
        # auto-advance PENDING -> SUBMITTED since proof was provided at creation
        from .services import submit_proof

        return submit_proof(submission=submission)


class PaymentSubmissionSerializer(serializers.ModelSerializer):
    """Read serializer — user's own history / detail view."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    purpose_display = serializers.CharField(
        source="get_purpose_display", read_only=True
    )
    payment_method = serializers.CharField(
        source="payment_configuration.payment_method", read_only=True
    )

    class Meta:
        model = PaymentSubmission
        fields = [
            "id",
            "purpose",
            "purpose_display",
            "related_object_id",
            "payment_method",
            "payer_name",
            "payer_phone",
            "amount_expected",
            "amount_declared",
            "transaction_ref",
            "proof_file",
            "status",
            "status_display",
            "rejection_reason",
            "proof_request_message",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PaymentSubmissionAdminSerializer(PaymentSubmissionSerializer):
    """Adds reviewer + user identity for the finance/admin queue."""

    reviewed_by_name = serializers.CharField(
        source="reviewed_by.get_full_name", read_only=True, default=""
    )
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta(PaymentSubmissionSerializer.Meta):
        fields = PaymentSubmissionSerializer.Meta.fields + [
            "user_email",
            "reviewed_by_name",
        ]


class RejectSubmissionSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=1000)


class RequestProofSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)


class ResubmitProofSerializer(serializers.Serializer):
    proof_file = serializers.FileField()
