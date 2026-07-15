from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions.roles import IsModerator
from apps.incidents.models import Incident
from shared.utils.ip import get_client_ip
from . import services
from .serializers import ModerationQueueItemSerializer, ModerationReviewSerializer


class ModerationQueueView(generics.ListAPIView):
    permission_classes = [IsModerator]
    serializer_class = ModerationQueueItemSerializer

    def get_queryset(self):
        status_filter = self.request.query_params.get("status", "pending")
        qs = Incident.objects.all()
        if status_filter != "all":
            qs = qs.filter(status=status_filter)
        return qs.order_by("submitted_at")


class ModerationReviewView(APIView):
    permission_classes = [IsModerator]

    def post(self, request, pk):
        serializer = ModerationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = Incident.objects.get(pk=pk)
        report = services.review_report(
            actor=request.user,
            report=report,
            new_status=serializer.validated_data["status"],
            rejection_reason=serializer.validated_data.get("rejection_reason", ""),
            redacted_description=serializer.validated_data.get(
                "redacted_description", ""
            ),
            ip_address=get_client_ip(request),
        )

        return Response(
            {"success": True, "status": report.status},
            status=status.HTTP_200_OK,
        )
