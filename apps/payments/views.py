from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PaymentConfiguration, PaymentSubmission, PaymentSubmissionStatus
from .serializers import (
    PaymentConfigurationPublicSerializer,
    PaymentConfigurationAdminSerializer,
    PaymentSubmissionCreateSerializer,
    PaymentSubmissionSerializer,
    PaymentSubmissionAdminSerializer,
    RejectSubmissionSerializer,
    RequestProofSerializer,
    ResubmitProofSerializer,
)
from .services import (
    PaymentSubmissionError,
    mark_under_review,
    approve_submission,
    reject_submission,
    request_new_proof,
    resubmit_proof,
)
from api.responses import (
    api_response,
)  # {"success", "message", "data", "meta"} envelope
from api.permissions import IsFinanceOrAdmin

# ── Citizen-facing ────────────────────────────────────────────────────────


class ActivePaymentConfigurationView(APIView):
    """GET /payments/config/active/?method=MTN"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        method = request.query_params.get("method")
        if not method:
            return api_response(
                success=False,
                message="Query param 'method' is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        config = PaymentConfiguration.objects.filter(
            payment_method=method, is_active=True
        ).first()

        if not config:
            return api_response(
                success=False,
                message=f"No active payment configuration for method '{method}'.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        data = PaymentConfigurationPublicSerializer(config).data
        return api_response(
            success=True, message="Active payment configuration.", data=data
        )


class PaymentSubmissionCreateView(generics.CreateAPIView):
    """POST /payments/submissions/  — user pays, uploads proof, in one call."""

    serializer_class = PaymentSubmissionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        out = PaymentSubmissionSerializer(submission).data
        return api_response(
            success=True,
            message="Payment submitted for review.",
            data=out,
            status_code=status.HTTP_201_CREATED,
        )


class MyPaymentSubmissionsView(generics.ListAPIView):
    """GET /payments/submissions/mine/"""

    serializer_class = PaymentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentSubmission.objects.filter(user=self.request.user)


class PaymentSubmissionDetailView(generics.RetrieveAPIView):
    """GET /payments/submissions/{id}/"""

    serializer_class = PaymentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return PaymentSubmission.objects.filter(user=self.request.user)


class ResubmitProofView(APIView):
    """POST /payments/submissions/{id}/resubmit/ — after PROOF_REQUESTED."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        submission = PaymentSubmission.objects.filter(id=id, user=request.user).first()
        if not submission:
            return api_response(
                success=False,
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = ResubmitProofSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            submission = resubmit_proof(
                submission=submission,
                new_proof_file=serializer.validated_data["proof_file"],
            )
        except PaymentSubmissionError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )

        return api_response(
            success=True,
            message="Proof resubmitted.",
            data=PaymentSubmissionSerializer(submission).data,
        )


# ── Admin / finance-facing ──────────────────────────────────────────────


class AdminPaymentConfigurationViewSet(generics.ListCreateAPIView):
    """GET/POST /admin/payments/config/"""

    queryset = PaymentConfiguration.objects.all()
    serializer_class = PaymentConfigurationAdminSerializer
    permission_classes = [IsFinanceOrAdmin]


class AdminPaymentSubmissionQueueView(generics.ListAPIView):
    """GET /admin/payments/submissions/?status=SUBMITTED"""

    serializer_class = PaymentSubmissionAdminSerializer
    permission_classes = [IsFinanceOrAdmin]

    def get_queryset(self):
        qs = PaymentSubmission.objects.select_related(
            "user", "payment_configuration", "reviewed_by"
        )
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class ApproveSubmissionView(APIView):
    permission_classes = [IsFinanceOrAdmin]

    def post(self, request, id):
        submission = _get_submission_or_404(id)
        if isinstance(submission, Response):
            return submission
        try:
            mark_under_review(submission=submission, admin_user=request.user)
            submission = approve_submission(
                submission=submission, admin_user=request.user
            )
        except PaymentSubmissionError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Payment verified.",
            data=PaymentSubmissionAdminSerializer(submission).data,
        )


class RejectSubmissionView(APIView):
    permission_classes = [IsFinanceOrAdmin]

    def post(self, request, id):
        submission = _get_submission_or_404(id)
        if isinstance(submission, Response):
            return submission
        serializer = RejectSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            submission = reject_submission(
                submission=submission,
                admin_user=request.user,
                reason=serializer.validated_data["reason"],
            )
        except PaymentSubmissionError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="Payment rejected.",
            data=PaymentSubmissionAdminSerializer(submission).data,
        )


class RequestProofView(APIView):
    permission_classes = [IsFinanceOrAdmin]

    def post(self, request, id):
        submission = _get_submission_or_404(id)
        if isinstance(submission, Response):
            return submission
        serializer = RequestProofSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            submission = request_new_proof(
                submission=submission,
                admin_user=request.user,
                message=serializer.validated_data["message"],
            )
        except PaymentSubmissionError as e:
            return api_response(
                success=False, message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
        return api_response(
            success=True,
            message="New proof requested from user.",
            data=PaymentSubmissionAdminSerializer(submission).data,
        )


def _get_submission_or_404(id):
    submission = PaymentSubmission.objects.filter(id=id).first()
    if not submission:
        return api_response(
            success=False, message="Not found.", status_code=status.HTTP_404_NOT_FOUND
        )
    return submission
