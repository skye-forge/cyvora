from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.responses import success_response


class DashboardView(APIView):
    """GET /api/v1/dashboard/ — FR-DASH-01..07: personalized home screen data."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: inline_serializer(
                "DashboardResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "message": serializers.CharField(required=False, allow_blank=True),
                    "data": serializers.DictField(required=False),
                },
            )
        }
    )
    def get(self, request):
        user = request.user

        # Recent activity — last 5 report status changes and lesson completions
        from apps.incidents.models import Incident
        from apps.learning.models import LessonProgress

        recent_incidents = Incident.objects.filter(reporter=user).order_by(
            "-submitted_at"
        )[:3]
        recent_lessons = LessonProgress.objects.filter(user=user).order_by(
            "-completed_at"
        )[:3]

        from apps.learning.selectors import get_user_ranking, get_user_progress
        from apps.learning.serializers import LessonProgressSerializer
        from apps.incidents.serializers import IncidentListSerializer

        ranking = get_user_ranking(user)
        progress = get_user_progress(user)

        return success_response(
            data={
                "user": {
                    "name": user.name,
                    "email": user.email,
                    "xp_points": user.xp_points,
                    "level": user.level,
                    "streak_count": user.streak_count,
                    "role": user.role,
                },
                "summary": {
                    "total_reports": Incident.objects.filter(reporter=user).count(),
                    "pending_reports": Incident.objects.filter(
                        reporter=user, status=Incident.STATUS_PENDING
                    ).count(),
                    "resolved_reports": Incident.objects.filter(
                        reporter=user,
                        status__in=[Incident.STATUS_APPROVED, Incident.STATUS_REJECTED],
                    ).count(),
                    "lessons_completed": LessonProgress.objects.filter(
                        user=user, completed=True
                    ).count(),
                    "rank": ranking["rank"],
                    "percentile": ranking["percentile"],
                },
                "recent_activity": {
                    "incidents": IncidentListSerializer(
                        recent_incidents, many=True
                    ).data,
                    "lessons": LessonProgressSerializer(recent_lessons, many=True).data,
                },
            }
        )
