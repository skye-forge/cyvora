from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import TrackingRequest, TrackingStatus, EvidenceRequest
from .serializers import (
    TrackingRequestCreateSerializer,
    TrackingRequestSerializer,
    TrackingRequestDetailSerializer,
    OwnershipVerificationSubmitSerializer,
    AssignAuthoritySerializer,
    RemarksSerializer,
    EvidenceSerializer,
    CreateEvidenceRequestSerializer,
    FulfillEvidenceRequestSerializer,
    AuthorityCaseSerializer,
)
from .services import (
    TrackingError,
    submit_ownership_verification,
    request_payment,
    assign_to_authority,
    mark_under_investigation,
    mark_located,
    mark_recovered,
    close_case,
    cancel_request,
    add_evidence,
    create_evidence_request,
    fulfill_evidence_request,
)
from api.responses import api_response
from api.permissions import IsOwnershipReviewerOrAdmin, IsCaseOfficerOrAdmin

# ── Citizen-facing ────────────────────────────────────────────────────────


class TrackingRequestCreateView(generics.CreateAPIView):
    """POST /tracking/requests/"""

    serializer_class = TrackingRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tracking_request = serializer.save()
        except TrackingError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Tracking request created.",
            data=TrackingRequestSerializer(tracking_request).data,
            status_code=status.HTTP_201_CREATED,
        )


class MyTrackingRequestsView(generics.ListAPIView):
    """GET /tracking/requests/mine/?status=UNDER_INVESTIGATION"""

    serializer_class = TrackingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TrackingRequest.objects.filter(user=self.request.user)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class TrackingRequestDetailView(generics.RetrieveAPIView):
    """GET /tracking/requests/{id}/ — includes full timeline."""

    serializer_class = TrackingRequestDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return TrackingRequest.objects.filter(user=self.request.user)


class InitiatePaymentView(APIView):
    """POST /tracking/requests/{id}/initiate-payment/ — DRAFT->OWNERSHIP_VERIFIED is
    admin-only; this moves OWNERSHIP_VERIFIED -> PAYMENT_PENDING once the
    citizen taps 'Pay Now' on the tracking fee screen."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        tracking_request = TrackingRequest.objects.filter(
            id=id, user=request.user
        ).first()
        if not tracking_request:
            return api_response(
                success=False,
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        try:
            tracking_request = request_payment(
                tracking_request=tracking_request, actor=request.user
            )
        except TrackingError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Ready for payment.",
            data=TrackingRequestSerializer(tracking_request).data,
        )


class CancelTrackingRequestView(APIView):
    """POST /tracking/requests/{id}/cancel/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        tracking_request = TrackingRequest.objects.filter(
            id=id, user=request.user
        ).first()
        if not tracking_request:
            return api_response(
                success=False,
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        serializer = RemarksSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tracking_request = cancel_request(
                tracking_request=tracking_request,
                actor=request.user,
                remarks=serializer.validated_data.get("remarks", ""),
            )
        except TrackingError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Tracking request cancelled.",
            data=TrackingRequestSerializer(tracking_request).data,
        )


class AddEvidenceView(generics.CreateAPIView):
    """POST /tracking/requests/{id}/evidence/"""

    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        tracking_request = TrackingRequest.objects.filter(
            id=kwargs["id"], user=request.user
        ).first()
        if not tracking_request:
            return api_response(
                success=False,
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence = add_evidence(
            tracking_request=tracking_request,
            uploaded_by=request.user,
            file=serializer.validated_data["file"],
            description=serializer.validated_data.get("description", ""),
        )
        return api_response(
            success=True,
            message="Evidence uploaded.",
            data=EvidenceSerializer(evidence).data,
            status_code=status.HTTP_201_CREATED,
        )


class FulfillEvidenceRequestView(APIView):
    """POST /tracking/evidence-requests/{id}/fulfill/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        evidence_request = EvidenceRequest.objects.filter(
            id=id, tracking_request__user=request.user
        ).first()
        if not evidence_request:
            return api_response(
                success=False,
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        serializer = FulfillEvidenceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            evidence = add_evidence(
                tracking_request=evidence_request.tracking_request,
                uploaded_by=request.user,
                file=serializer.validated_data["file"],
                description=serializer.validated_data.get("description", ""),
            )
            evidence_request = fulfill_evidence_request(
                evidence_request=evidence_request, evidence=evidence
            )
        except TrackingError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Evidence request fulfilled.",
            data={"evidence_request_id": str(evidence_request.id)},
        )


# ── Admin-facing ─────────────────────────────────────────────────────────


class AdminTrackingQueueView(generics.ListAPIView):
    """GET /admin/tracking/requests/?status=QUEUED"""

    serializer_class = TrackingRequestSerializer
    permission_classes = [IsCaseOfficerOrAdmin]

    def get_queryset(self):
        qs = TrackingRequest.objects.select_related("user")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminTrackingDetailView(generics.RetrieveAPIView):
    serializer_class = TrackingRequestDetailSerializer
    permission_classes = [IsCaseOfficerOrAdmin]
    queryset = TrackingRequest.objects.all()
    lookup_field = "id"


class AdminSubmitOwnershipVerificationView(APIView):
    """POST /admin/tracking/requests/{id}/ownership-verification/"""

    permission_classes = [IsOwnershipReviewerOrAdmin]

    def post(self, request, id):
        tracking_request = _get_or_404(id)
        if isinstance(tracking_request, Response):
            return tracking_request
        serializer = OwnershipVerificationSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            verification = submit_ownership_verification(
                tracking_request=tracking_request,
                admin_user=request.user,
                **serializer.validated_data,
            )
        except TrackingError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message=(
                "Ownership verified."
                if verification.passes
                else "Ownership verification failed."
            ),
            data={"score": verification.score, "passes": verification.passes},
        )


class AdminAssignAuthorityView(APIView):
    """POST /admin/tracking/requests/{id}/assign-authority/"""

    permission_classes = [IsCaseOfficerOrAdmin]

    def post(self, request, id):
        tracking_request = _get_or_404(id)
        if isinstance(tracking_request, Response):
            return tracking_request
        serializer = AssignAuthoritySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            case = assign_to_authority(
                tracking_request=tracking_request,
                actor=request.user,
                **serializer.validated_data,
            )
        except TrackingError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Assigned to authority.",
            data=AuthorityCaseSerializer(case).data,
            status_code=status.HTTP_201_CREATED,
        )


def _make_status_action(service_fn, success_message):
    class _View(APIView):
        permission_classes = [IsCaseOfficerOrAdmin]

        def post(self, request, id):
            tracking_request = _get_or_404(id)
            if isinstance(tracking_request, Response):
                return tracking_request
            serializer = RemarksSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            try:
                updated = service_fn(
                    tracking_request=tracking_request,
                    actor=request.user,
                    remarks=serializer.validated_data.get("remarks", ""),
                )
            except TrackingError as e:
                return api_response(
                    success=False,
                    message=str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            return api_response(
                success=True,
                message=success_message,
                data=TrackingRequestSerializer(updated).data,
            )

    return _View


AdminMarkUnderInvestigationView = _make_status_action(
    mark_under_investigation, "Marked under investigation."
)
AdminMarkLocatedView = _make_status_action(mark_located, "Marked located.")
AdminMarkRecoveredView = _make_status_action(mark_recovered, "Marked recovered.")
AdminCloseCaseView = _make_status_action(close_case, "Case closed.")


class AdminCreateEvidenceRequestView(APIView):
    """POST /admin/tracking/requests/{id}/request-evidence/"""

    permission_classes = [IsCaseOfficerOrAdmin]

    def post(self, request, id):
        tracking_request = _get_or_404(id)
        if isinstance(tracking_request, Response):
            return tracking_request
        serializer = CreateEvidenceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence_request = create_evidence_request(
            tracking_request=tracking_request,
            requested_by=request.user,
            message=serializer.validated_data["message"],
        )
        return api_response(
            success=True,
            message="Evidence requested from citizen.",
            data={"evidence_request_id": str(evidence_request.id)},
            status_code=status.HTTP_201_CREATED,
        )


def _get_or_404(id):
    tracking_request = TrackingRequest.objects.filter(id=id).first()
    if not tracking_request:
        return api_response(
            success=False, message="Not found.", status_code=status.HTTP_404_NOT_FOUND
        )
    return tracking_request
