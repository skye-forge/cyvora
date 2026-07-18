from django.contrib import admin

from .models import KYCSubmission, KYCAuditLog


class KYCAuditLogInline(admin.TabularInline):
    model = KYCAuditLog
    extra = 0
    readonly_fields = ("action", "actor", "note", "created_at")
    can_delete = False


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "user",
        "id_document_type",
        "status",
        "is_latest",
        "expires_at",
        "created_at",
    )
    list_filter = ("status", "id_document_type", "is_latest")
    search_fields = ("full_name", "id_number", "user__email")
    readonly_fields = ("created_at", "updated_at")
    inlines = [KYCAuditLogInline]


@admin.register(KYCAuditLog)
class KYCAuditLogAdmin(admin.ModelAdmin):
    list_display = ("submission", "action", "actor", "created_at")
    list_filter = ("action",)
    readonly_fields = ("submission", "action", "actor", "note", "created_at")
