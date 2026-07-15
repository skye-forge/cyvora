from django.contrib import admin
from django.utils import timezone

from .models import (
    Zone, LearningModule, Lesson, LessonPart,
    LessonProgress, XPTransaction, Badge, UserBadge,
    Streak, DailyTip,
)


# ──────────────────────────────────────────────
# Actions
# ──────────────────────────────────────────────

@admin.action(description="Publish selected zones")
def publish_zones(modeladmin, request, queryset):
    queryset.update(
        status="published",
        published_at=timezone.now(),
    )


@admin.action(description="Archive selected zones")
def archive_zones(modeladmin, request, queryset):
    queryset.update(status="archived")


# ──────────────────────────────────────────────
# ModelAdmins
# ──────────────────────────────────────────────

@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "difficulty",
        "status",
        "display_order",
        "estimated_hours",
        "published_at",
        "created_at",
    )
    list_filter = ("status", "difficulty", "created_at")
    search_fields = ("title", "description", "slug")
    readonly_fields = ("slug", "created_at", "updated_at", "published_at")
    ordering = ("display_order", "title")
    list_per_page = 25
    date_hierarchy = "created_at"
    actions = (publish_zones, archive_zones)
    save_on_top = True


@admin.register(LearningModule)
class LearningModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "zone", "order")
    list_filter = ("zone",)
    search_fields = ("title",)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "order", "duration_minutes")
    list_filter = ("module__zone",)
    search_fields = ("title",)


@admin.register(LessonPart)
class LessonPartAdmin(admin.ModelAdmin):
    list_display = ("lesson", "part_type", "order")
    list_filter = ("part_type",)
    search_fields = ("title",)


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "completed", "completed_at")
    list_filter = ("completed",)
    search_fields = ("user__email", "lesson__title")


@admin.register(XPTransaction)
class XPTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "transaction_type", "created_at")
    list_filter = ("transaction_type",)
    search_fields = ("user__email",)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("name", "xp_bonus", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "awarded_at")
    search_fields = ("user__email", "badge__name")


@admin.register(Streak)
class StreakAdmin(admin.ModelAdmin):
    list_display = ("user", "current_count", "longest_count", "last_activity_date")
    search_fields = ("user__email",)


@admin.register(DailyTip)
class DailyTipAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "is_active", "created_at")
    list_filter = ("is_active", "category")
    search_fields = ("title",)
