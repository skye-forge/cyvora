from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.permissions import IsModerator, IsOwnerOrAdmin
from api.responses import success_response
from services.incidents.moderation import moderate_incident
from services.incidents.report import submit_incident
from shared.mixins import ServiceExceptionHandlingMixin

from . import selectors
from .serializers import (
    IncidentDetailSerializer,
    IncidentListSerializer,
    ModerateIncidentSerializer,
    SubmitIncidentSerializer,
)


def _incident_list_response_schema():
    return inline_serializer(
        "IncidentListEnvelope",
        fields={
            "success": serializers.BooleanField(),
            "message": serializers.CharField(required=False, allow_blank=True),
            "data": serializers.ListSerializer(child=IncidentListSerializer()),
        },
    )


def _incident_detail_response_schema():
    return inline_serializer(
        "IncidentDetailEnvelope",
        fields={
            "success": serializers.BooleanField(),
            "message": serializers.CharField(required=False, allow_blank=True),
            "data": IncidentDetailSerializer(),
        },
    )


class IncidentListCreateView(ServiceExceptionHandlingMixin, APIView):
    """
    GET /api/v1/incidents/?status=pending — FR-TRK-01, "My Reports"
    POST /api/v1/incidents/ — FR-INC-01..08, submit a report
    """

    permission_classes = [IsAuthenticated]
    serializer_class = SubmitIncidentSerializer

    @extend_schema(responses={200: _incident_list_response_schema()})
    def get(self, request):
        incidents = selectors.list_incidents(
            user=request.user,
            status=request.query_params.get("status"),
        )
        return success_response(data=IncidentListSerializer(incidents, many=True).data)

    @extend_schema(
        request=SubmitIncidentSerializer,
        responses={201: _incident_detail_response_schema()},
    )
    def post(self, request):
        serializer = SubmitIncidentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        incident = submit_incident(
            user=request.user, validated_data=serializer.validated_data
        )
        return success_response(
            data=IncidentDetailSerializer(incident).data,
            message=f"Report {incident.report_reference} submitted. Our response team typically "
            f"acknowledges within 15 minutes.",
            status=201,
        )


class IncidentDetailView(ServiceExceptionHandlingMixin, APIView):
    """GET /api/v1/incidents/{id} — FR-TRK-03/04, full status timeline + evidence."""

    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    @extend_schema(responses={200: _incident_detail_response_schema()})
    def get(self, request, incident_id):
        incident = selectors.get_incident(incident_id)
        self.check_object_permissions(request, incident)
        return success_response(data=IncidentDetailSerializer(incident).data)


class ModerateIncidentView(ServiceExceptionHandlingMixin, APIView):
    """PATCH /api/v1/incidents/{id}/moderate — FR-MOD-02, moderator-only status transitions."""

    permission_classes = [IsAuthenticated, IsModerator]

    @extend_schema(
        request=ModerateIncidentSerializer,
        responses={200: _incident_detail_response_schema()},
    )
    def patch(self, request, incident_id):
        incident = selectors.get_incident(incident_id)
        serializer = ModerateIncidentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        incident = moderate_incident(
            moderator=request.user,
            incident=incident,
            new_status=validated["status"],
            reason=validated["reason"],
            alert_content=validated["alert_content"],
        )
        return success_response(
            data=IncidentDetailSerializer(incident).data,
            message=f"Report moved to '{incident.get_status_display()}'.",
        )
