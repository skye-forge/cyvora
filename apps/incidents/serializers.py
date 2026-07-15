from rest_framework import serializers

from .models import Incident, IncidentCategory


class IncidentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentCategory
        fields = ["id", "name", "description"]
        read_only_fields = fields


class IncidentListSerializer(serializers.ModelSerializer):
    """Slim shape for 'My Reports' (FR-TRK-01/02): category, short title,
    submission date, status badge — not the full report body."""

    category = IncidentCategorySerializer(read_only=True)
    short_title = serializers.ReadOnlyField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "report_reference",
            "category",
            "short_title",
            "status",
            "submitted_at",
        ]
        read_only_fields = fields


class IncidentDetailSerializer(serializers.ModelSerializer):
    """Full report view (FR-TRK-03/04): status timeline fields,
    description, evidence, rejection reason if any."""

    category = IncidentCategorySerializer(read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "report_reference",
            "category",
            "description",
            "evidence_urls",
            "location_shared",
            "latitude",
            "longitude",
            "status",
            "rejection_reason",
            "reporter",
            "is_anonymous",
            "submitted_at",
            "resolved_at",
        ]
        read_only_fields = [
            "id",
            "report_reference",
            "status",
            "rejection_reason",
            "reporter",
            "submitted_at",
            "resolved_at",
        ]


class SubmitIncidentSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=IncidentCategory.objects.all(),
        source="category",
    )

    class Meta:
        model = Incident
        fields = [
            "category_id",
            "description",
            "evidence_urls",
            "location_shared",
            "latitude",
            "longitude",
            "is_anonymous",
        ]

    def validate(self, attrs):
        if attrs.get("location_shared") and (
            attrs.get("latitude") is None or attrs.get("longitude") is None
        ):
            raise serializers.ValidationError(
                "latitude and longitude are required when location_shared is true."
            )
        return attrs


class ModerateIncidentSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            (Incident.STATUS_UNDER_REVIEW, "Under Review"),
            (Incident.STATUS_APPROVED, "Approved"),
            (Incident.STATUS_REJECTED, "Rejected"),
        ]
    )
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    alert_content = serializers.CharField(
        required=False, allow_blank=True, default=None, allow_null=True
    )
