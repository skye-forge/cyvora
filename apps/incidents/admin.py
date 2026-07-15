from django.contrib import admin

from .models import Incident, IncidentCategory, ModerationLog


@admin.register(IncidentCategory)
class IncidentCategoryAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        "report_reference",
        "category",
        "status",
        "reporter",
        "submitted_at",
    ]
    list_filter = ["status", "category"]
    search_fields = ["report_reference", "description"]
    readonly_fields = ["report_reference", "submitted_at"]


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ["incident", "moderator", "from_status", "to_status", "created_at"]
    readonly_fields = [
        "incident",
        "moderator",
        "from_status",
        "to_status",
        "reason",
        "created_at",
    ]
