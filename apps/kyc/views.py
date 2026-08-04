from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response

from api.responses import build_success_response_schema

from .models import KYCSubmission
from .serializers import (
    KYCSubmissionCreateSerializer,
    KYCSubmissionSerializer,
    KYCSubmissionAdminSerializer,
    KYCAuditLogSerializer,
    RejectKYCSerializer,
)
from .services import (
    KYCError,
    get_latest_submission,
    is_user_verified,
    submit_for_review,
    mark_under_review,
    approve_submission,
    reject_submission,
)
from api.responses import api_response
from api.permissions import IsKYCReviewerOrAdmin

# ── Citizen-facing ────────────────────────────────────────────────────────


class KYCSubmissionCreateView(generics.CreateAPIView):
    """POST /kyc/submissions/  — create draft or resubmit after rejection."""

    serializer_class = KYCSubmissionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            submission = serializer.save()
        except KYCError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="KYC draft created.",
            data=KYCSubmissionSerializer(submission).data,
            status_code=status.HTTP_201_CREATED,
        )


class SubmitKYCForReviewView(APIView):
    """POST /kyc/submissions/{id}/submit/"""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: build_success_response_schema(KYCSubmissionSerializer())}
    )
    def post(self, request, id):
        submission = KYCSubmission.objects.filter(id=id, user=request.user).first()
        if not submission:
            return api_response(
                success=False,
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        try:
            submission = submit_for_review(submission=submission)
        except KYCError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Submitted for review.",
            data=KYCSubmissionSerializer(submission).data,
        )


class MyKYCStatusView(APIView):
    """GET /kyc/me/ — current status + whether the user counts as verified."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: build_success_response_schema(serializers.DictField())}
    )
    def get(self, request):
        latest = get_latest_submission(request.user)
        data = {
            "is_verified": is_user_verified(request.user),
            "latest_submission": (
                KYCSubmissionSerializer(latest).data if latest else None
            ),
        }
        return api_response(success=True, message="KYC status.", data=data)


class KYCSubmissionHistoryView(generics.ListAPIView):
    """GET /kyc/history/ — every submission the user has ever made."""

    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KYCSubmission.objects.filter(user=self.request.user)


# ── Admin-facing ─────────────────────────────────────────────────────────


class AdminKYCQueueView(generics.ListAPIView):
    """GET /admin/kyc/submissions/?status=SUBMITTED"""

    serializer_class = KYCSubmissionAdminSerializer
    permission_classes = [IsKYCReviewerOrAdmin]

    def get_queryset(self):
        qs = KYCSubmission.objects.select_related("user", "reviewed_by")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminKYCDetailView(generics.RetrieveAPIView):
    """GET /admin/kyc/submissions/{id}/ — includes audit trail."""

    serializer_class = KYCSubmissionAdminSerializer
    permission_classes = [IsKYCReviewerOrAdmin]
    queryset = KYCSubmission.objects.all()
    lookup_field = "id"

    def retrieve(self, request, *args, **kwargs):
        submission = self.get_object()
        data = self.get_serializer(submission).data
        data["audit_trail"] = KYCAuditLogSerializer(
            submission.audit_entries.all(), many=True
        ).data
        return api_response(success=True, message="KYC submission detail.", data=data)


class AdminApproveKYCView(APIView):
    permission_classes = [IsKYCReviewerOrAdmin]

    @extend_schema(
        responses={200: build_success_response_schema(KYCSubmissionAdminSerializer())}
    )
    def post(self, request, id):
        submission = _get_or_404(id)
        if isinstance(submission, Response):
            return submission
        try:
            mark_under_review(submission=submission, admin_user=request.user)
            submission = approve_submission(
                submission=submission, admin_user=request.user
            )
        except KYCError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="KYC approved.",
            data=KYCSubmissionAdminSerializer(submission).data,
        )


class AdminRejectKYCView(APIView):
    permission_classes = [IsKYCReviewerOrAdmin]

    @extend_schema(
        request=RejectKYCSerializer,
        responses={200: build_success_response_schema(KYCSubmissionAdminSerializer())},
    )
    def post(self, request, id):
        submission = _get_or_404(id)
        if isinstance(submission, Response):
            return submission
        serializer = RejectKYCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            submission = reject_submission(
                submission=submission,
                admin_user=request.user,
                reason=serializer.validated_data["reason"],
            )
        except KYCError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="KYC rejected.",
            data=KYCSubmissionAdminSerializer(submission).data,
        )


def _get_or_404(id):
    submission = KYCSubmission.objects.filter(id=id).first()
    if not submission:
        return api_response(
            success=False, message="Not found.", status_code=status.HTTP_404_NOT_FOUND
        )
    return submission
