from rest_framework import serializers

from apps.learning.models import (
    Zone, LearningModule, Lesson, LessonPart,
    LessonProgress, XPTransaction, Badge, UserBadge,
    Streak, DailyTip,
)
from shared.enums.learning import DifficultyLevel


class ZoneSerializer(serializers.ModelSerializer):
    difficulty_display = serializers.CharField(
        source="get_difficulty_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = Zone
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "icon",
            "color",
            "difficulty",
            "difficulty_display",
            "estimated_hours",
            "display_order",
            "status",
            "status_display",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "published_at",
            "created_at",
            "updated_at",
        )


class LearningZoneSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = [
            "id", "title", "slug", "description", "icon", "color",
            "difficulty", "estimated_hours", "display_order",
            "status", "is_unlocked", "completion_percentage",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_is_unlocked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        user = request.user
        # Zone is unlocked if user has enough XP or all previous zones completed
        if obj.display_order == 0:
            return True
        # Check XP threshold (first zone is free, subsequent ones need XP)
        threshold = obj.display_order * 100  # 100 XP per zone level
        return user.xp_points >= threshold

    def get_completion_percentage(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0.0
        from apps.learning.selectors import get_zone_completion
        return get_zone_completion(request.user, obj)


class LearningModuleSerializer(serializers.ModelSerializer):
    lesson_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = LearningModule
        fields = [
            "id", "zone_id", "title", "description", "order",
            "lesson_count", "completion_percentage", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_lesson_count(self, obj):
        return obj.lessons.count()

    def get_completion_percentage(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0.0
        from apps.learning.selectors import get_module_completion
        return get_module_completion(request.user, obj)


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id", "module_id", "title", "content", "order",
            "duration_minutes", "is_completed", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_is_completed(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return LessonProgress.objects.filter(
            user=request.user, lesson=obj, completed=True
        ).exists()


class LessonPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonPart
        fields = [
            "id", "lesson_id", "part_type", "title",
            "content", "order", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            "id", "user_id", "lesson_id", "lesson_title",
            "completed", "completed_at",
        ]
        read_only_fields = ["id", "user_id", "completed_at"]


class XPTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = XPTransaction
        fields = [
            "id", "user_id", "amount", "transaction_type",
            "description", "created_at",
        ]
        read_only_fields = ["id", "user_id", "created_at"]


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "name", "description", "icon", "xp_bonus", "is_active"]
        read_only_fields = ["id"]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge_name = serializers.CharField(source="badge.name", read_only=True)
    badge_icon = serializers.CharField(source="badge.icon", read_only=True)
    badge_description = serializers.CharField(source="badge.description", read_only=True)
    xp_bonus = serializers.IntegerField(source="badge.xp_bonus", read_only=True)

    class Meta:
        model = UserBadge
        fields = [
            "id", "badge_id", "badge_name", "badge_icon",
            "badge_description", "xp_bonus", "awarded_at",
        ]
        read_only_fields = ["id", "awarded_at"]


class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = [
            "id", "user_id", "current_count", "longest_count",
            "last_activity_date", "updated_at",
        ]
        read_only_fields = ["id", "user_id", "updated_at"]


class DailyTipSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyTip
        fields = [
            "id", "title", "content", "category", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ──────────────────────────────────────────────
# Admin serializers
# ──────────────────────────────────────────────

class AdminZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = "__all__"
        read_only_fields = ("id", "slug", "created_at", "updated_at", "published_at")


class AdminLearningModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningModule
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class AdminLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class AdminLessonPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonPart
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class AdminDailyTipSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyTip
        fields = "__all__"
        read_only_fields = ("id", "created_at")
