from rest_framework import serializers
from apps.incidents.models import Incident


class ModerationReviewSerializer(serializers.Serializer):
    STATUS_CHOICES = ["under_review", "approved", "rejected"]

    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    redacted_description = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["status"] == "rejected" and not data.get("rejection_reason"):
            raise serializers.ValidationError(
                "rejection_reason is required when rejecting a report."
            )
        return data


class ModerationQueueItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = [
            "id",
            "report_reference",
            "category",
            "description",
            "status",
            "submitted_at",
        ]
