from rest_framework import serializers

from .models import (
    TrackingRequest,
    ElectronicDevice,
    Vehicle,
    OwnershipVerification,
    AuthorityCase,
    Evidence,
    EvidenceRequest,
    TimelineEvent,
)


class ElectronicDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectronicDevice
        exclude = ["tracking_request"]


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        exclude = ["tracking_request"]


class OwnershipVerificationSerializer(serializers.ModelSerializer):
    score = serializers.IntegerField(read_only=True)
    passes = serializers.BooleanField(read_only=True)

    class Meta:
        model = OwnershipVerification
        fields = [
            "matched_account_name",
            "matched_phone",
            "matched_password",
            "friend_account_used",
            "score",
            "passes",
            "verified_by",
            "verified_at",
            "notes",
        ]
        read_only_fields = ["verified_by", "verified_at", "score", "passes"]


class AuthorityCaseSerializer(serializers.ModelSerializer):
    agency_display = serializers.CharField(source="get_agency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AuthorityCase
        fields = [
            "id",
            "case_number",
            "agency",
            "agency_display",
            "institution_name",
            "institution_id",
            "assigned_officer",
            "assigned_date",
            "expected_completion",
            "status",
            "status_display",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = ["id", "file", "description", "uploaded_by", "created_at"]
        read_only_fields = ["id", "uploaded_by", "created_at"]


class EvidenceRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = EvidenceRequest
        fields = [
            "id",
            "requested_by",
            "message",
            "status",
            "status_display",
            "fulfilled_by_evidence",
            "created_at",
            "fulfilled_at",
        ]
        read_only_fields = fields


class TimelineEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True, default=""
    )

    class Meta:
        model = TimelineEvent
        fields = ["id", "event_type", "description", "created_by_name", "created_at"]
        read_only_fields = fields


class TrackingRequestCreateSerializer(serializers.Serializer):
    """
    Accepts the flat create payload (category + nested device/vehicle data)
    and delegates to services.create_tracking_request so the OneToOne
    child rows and the first timeline event are created atomically.
    """

    category = serializers.ChoiceField(choices=["ELECTRONIC_DEVICE", "VEHICLE"])
    description = serializers.CharField(required=False, allow_blank=True)
    device_data = ElectronicDeviceSerializer(required=False)
    vehicle_data = VehicleSerializer(required=False)

    def create(self, validated_data):
        from .services import create_tracking_request

        user = self.context["request"].user
        return create_tracking_request(user=user, **validated_data)


class TrackingRequestSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    device_detail = ElectronicDeviceSerializer(read_only=True)
    vehicle_detail = VehicleSerializer(read_only=True)
    ownership_verification = OwnershipVerificationSerializer(read_only=True)

    class Meta:
        model = TrackingRequest
        fields = [
            "id",
            "reference_code",
            "category",
            "category_display",
            "status",
            "status_display",
            "description",
            "device_detail",
            "vehicle_detail",
            "ownership_verification",
            "created_at",
            "updated_at",
            "closed_at",
        ]
        read_only_fields = fields


class TrackingRequestDetailSerializer(TrackingRequestSerializer):
    authority_cases = AuthorityCaseSerializer(many=True, read_only=True)
    evidence_items = EvidenceSerializer(many=True, read_only=True)
    evidence_requests = EvidenceRequestSerializer(many=True, read_only=True)
    timeline_events = TimelineEventSerializer(many=True, read_only=True)

    class Meta(TrackingRequestSerializer.Meta):
        fields = TrackingRequestSerializer.Meta.fields + [
            "authority_cases",
            "evidence_items",
            "evidence_requests",
            "timeline_events",
        ]


class OwnershipVerificationSubmitSerializer(serializers.Serializer):
    matched_account_name = serializers.BooleanField()
    matched_phone = serializers.BooleanField()
    matched_password = serializers.BooleanField()
    friend_account_used = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class AssignAuthoritySerializer(serializers.Serializer):
    agency = serializers.ChoiceField(
        choices=[c[0] for c in AuthorityCase._meta.get_field("agency").choices]
    )
    institution_name = serializers.CharField(required=False, allow_blank=True)
    institution_id = serializers.UUIDField(required=False, allow_null=True)
    assigned_officer = serializers.CharField(required=False, allow_blank=True)
    case_number = serializers.CharField(required=False, allow_blank=True)
    expected_completion = serializers.DateField(required=False, allow_null=True)


class RemarksSerializer(serializers.Serializer):
    remarks = serializers.CharField(required=False, allow_blank=True)


class CreateEvidenceRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)


class FulfillEvidenceRequestSerializer(serializers.Serializer):
    file = serializers.FileField()
    description = serializers.CharField(required=False, allow_blank=True)
