from django.db.models import F
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.responses import success_response
from apps.learning.selectors import (
    list_zones,
    list_modules,
    list_lessons,
    list_lesson_parts,
    get_user_progress,
    get_top_learners,
    get_user_ranking,
    get_daily_tip,
)
from apps.learning.serializers import (
    LessonPartSerializer,
    LessonProgressSerializer,
    XPTransactionSerializer,
    DailyTipSerializer,
    LearningZoneSerializer,
    LearningModuleSerializer,
    LessonSerializer,
    UserBadgeSerializer,
    StreakSerializer,
)
from services.learning.lesson_progress import mark_lesson_complete
from services.learning.streak import record_activity
from services.learning.badges import check_and_award_badge
from shared.mixins import ServiceExceptionHandlingMixin


class LearningZoneListView(APIView):
    """GET /api/v1/learning/zones/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        zones = list_zones()
        serializer = LearningZoneSerializer(
            zones, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class LearningModuleListView(APIView):
    """GET /api/v1/learning/zones/<zone_id>/modules/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, zone_id):
        modules = list_modules(zone_id=zone_id)
        serializer = LearningModuleSerializer(
            modules, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class LessonListView(APIView):
    """GET /api/v1/learning/modules/<module_id>/lessons/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, module_id):
        lessons = list_lessons(module_id=module_id)
        serializer = LessonSerializer(
            lessons, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class LessonPartListView(APIView):
    """GET /api/v1/learning/lessons/<lesson_id>/parts/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        parts = list_lesson_parts(lesson_id=lesson_id)
        serializer = LessonPartSerializer(parts, many=True)
        return success_response(data=serializer.data)


class LessonCompleteView(ServiceExceptionHandlingMixin, APIView):
    """POST /api/v1/learning/lessons/<lesson_id>/complete/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        progress = mark_lesson_complete(user=request.user, lesson_id=lesson_id)
        return success_response(
            data=LessonProgressSerializer(progress).data,
            message="Lesson marked complete.",
        )


class LessonProgressView(APIView):
    """GET /api/v1/learning/lessons/<lesson_id>/progress/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        from apps.learning.models import Lesson, LessonProgress

        lesson = Lesson.objects.get(id=lesson_id)
        progress = LessonProgress.objects.filter(
            user=request.user, lesson=lesson
        ).first()
        serializer = LessonProgressSerializer(progress)
        return success_response(data=serializer.data)


class MyProgressView(APIView):
    """GET /api/v1/learning/progress/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = get_user_progress(request.user)
        serializer = LessonProgressSerializer(progress, many=True)
        return success_response(data=serializer.data)


class ResumeLearningView(APIView):
    """GET /api/v1/learning/resume/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import LessonProgress, Zone, Lesson

        incomplete = LessonProgress.objects.filter(
            user=request.user, completed=False
        ).select_related("lesson").first()

        if incomplete:
            lesson = incomplete.lesson
            return success_response(data={
                "lesson_id": str(lesson.id),
                "lesson_title": lesson.title,
                "module_id": str(lesson.module_id),
            })

        zone = Zone.objects.filter(
            modules__lessons__isnull=False
        ).order_by("display_order").first()
        if zone:
            lesson = Lesson.objects.filter(
                module__zone=zone
            ).order_by("module__order", "order").first()
            if lesson:
                return success_response(data={
                    "lesson_id": str(lesson.id),
                    "lesson_title": lesson.title,
                    "module_id": str(lesson.module_id),
                })

        return success_response(data=None)


class CompletedLessonsView(APIView):
    """GET /api/v1/learning/completed-lessons/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import LessonProgress

        completed = LessonProgress.objects.filter(
            user=request.user, completed=True
        ).select_related("lesson")
        serializer = LessonProgressSerializer(completed, many=True)
        return success_response(data=serializer.data)


class CompletedModulesView(APIView):
    """GET /api/v1/learning/completed-modules/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import LearningModule
        from django.db.models import Count, Q

        modules = LearningModule.objects.annotate(
            total_lessons=Count("lessons"),
            completed_lessons=Count(
                "lessons__progress",
                filter=Q(
                    lessons__progress__user=request.user,
                    lessons__progress__completed=True,
                ),
            ),
        ).filter(total_lessons__gt=0, total_lessons=F("completed_lessons"))
        serializer = LearningModuleSerializer(
            modules, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class CompletedZonesView(APIView):
    """GET /api/v1/learning/completed-zones/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Q
        from apps.learning.models import Zone

        zones = Zone.objects.annotate(
            total_lessons=Count("modules__lessons"),
            completed_lessons=Count(
                "modules__lessons__progress",
                filter=Q(
                    modules__lessons__progress__user=request.user,
                    modules__lessons__progress__completed=True,
                ),
            ),
        ).filter(total_lessons__gt=0, total_lessons=F("completed_lessons"))
        serializer = LearningZoneSerializer(
            zones, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class TopLearnersView(APIView):
    """GET /api/v1/learning/leaderboard/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        learners = get_top_learners()
        data = [
            {"email": u.email, "name": u.name, "xp_points": u.xp_points, "level": u.level}
            for u in learners
        ]
        return success_response(data=data)


class MyRankingView(APIView):
    """GET /api/v1/learning/my-ranking/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ranking = get_user_ranking(request.user)
        return success_response(data=ranking)


class MyXpHistoryView(APIView):
    """GET /api/v1/learning/xp-history/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import XPTransaction

        transactions = XPTransaction.objects.filter(user=request.user)[:50]
        serializer = XPTransactionSerializer(transactions, many=True)
        return success_response(data=serializer.data)


class MyBadgesView(APIView):
    """GET /api/v1/learning/my-badges/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import UserBadge

        badges = UserBadge.objects.filter(user=request.user).select_related("badge")
        serializer = UserBadgeSerializer(badges, many=True)
        return success_response(data=serializer.data)


class MyStreakView(APIView):
    """GET /api/v1/learning/my-streak/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import Streak

        streak, _ = Streak.objects.get_or_create(user=request.user)
        serializer = StreakSerializer(streak)
        return success_response(data=serializer.data)


class DailyTipView(APIView):
    """GET /api/v1/learning/daily-tip/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tip = get_daily_tip()
        if not tip:
            return success_response(data=None)
        serializer = DailyTipSerializer(tip)
        return success_response(data=serializer.data)


# ──────────────────────────────────────────────
# Admin Console API views  (registered via admin_console/urls.py)
# ──────────────────────────────────────────────

from rest_framework import viewsets
from apps.learning.permissions import IsLearningAdmin
from apps.learning.selectors import get_all_zones
from apps.learning.serializers import (
    AdminZoneSerializer,
    AdminLearningModuleSerializer,
    AdminLessonSerializer,
    AdminLessonPartSerializer,
    AdminDailyTipSerializer,
)
from apps.learning.models import Zone, LearningModule, Lesson, LessonPart, DailyTip
from services.learning.zone_service import ZoneService


class AdminZoneViewSet(viewsets.ModelViewSet):
    serializer_class = AdminZoneSerializer
    permission_classes = [IsLearningAdmin]

    def get_queryset(self):
        return get_all_zones()

    def perform_create(self, serializer):
        zone = ZoneService.create_zone(**serializer.validated_data)
        return zone

    def perform_update(self, serializer):
        ZoneService.update_zone(zone=self.get_object(), **serializer.validated_data)


class AdminModuleViewSet(viewsets.ModelViewSet):
    serializer_class = AdminLearningModuleSerializer
    permission_classes = [IsLearningAdmin]
    queryset = LearningModule.objects.all().order_by("zone_id", "order")


class AdminLessonViewSet(viewsets.ModelViewSet):
    serializer_class = AdminLessonSerializer
    permission_classes = [IsLearningAdmin]
    queryset = Lesson.objects.all().order_by("module_id", "order")


class AdminLessonPartViewSet(viewsets.ModelViewSet):
    serializer_class = AdminLessonPartSerializer
    permission_classes = [IsLearningAdmin]
    queryset = LessonPart.objects.all().order_by("lesson_id", "order")


class AdminDailyTipViewSet(viewsets.ModelViewSet):
    serializer_class = AdminDailyTipSerializer
    permission_classes = [IsLearningAdmin]
    queryset = DailyTip.objects.all().order_by("-created_at")
