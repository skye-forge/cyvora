from django.contrib import admin
from django.utils.html import format_html

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
    readonly_fields = (
        "created_at",
        "updated_at",
        "id_document_front_preview",
        "id_document_back_preview",
        "selfie_photo_preview",
    )
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "full_name",
                    "id_document_type",
                    "id_number",
                    "date_of_birth",
                )
            },
        ),
        (
            "Documents — review before approving",
            {
                "fields": (
                    "id_document_front",
                    "id_document_front_preview",
                    "id_document_back",
                    "id_document_back_preview",
                    "selfie_photo",
                    "selfie_photo_preview",
                ),
            },
        ),
        (
            "Review",
            {
                "fields": (
                    "status",
                    "is_latest",
                    "supersedes",
                    "reviewed_by",
                    "reviewed_at",
                    "rejection_reason",
                    "expires_at",
                ),
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    inlines = [KYCAuditLogInline]

    def _preview(self, file_field):
        if not file_field:
            return "— none uploaded —"
        return format_html(
            '<a href="{0}" target="_blank">'
            '<img src="{0}" style="max-height:220px;max-width:320px;'
            'border:1px solid #ccc;border-radius:4px;" />'
            "</a>",
            file_field.url,
        )

    def id_document_front_preview(self, obj):
        return self._preview(obj.id_document_front)

    id_document_front_preview.short_description = "Front preview"

    def id_document_back_preview(self, obj):
        return self._preview(obj.id_document_back)

    id_document_back_preview.short_description = "Back preview"

    def selfie_photo_preview(self, obj):
        return self._preview(obj.selfie_photo)

    selfie_photo_preview.short_description = "Selfie preview"


@admin.register(KYCAuditLog)
class KYCAuditLogAdmin(admin.ModelAdmin):
    list_display = ("submission", "action", "actor", "created_at")
    list_filter = ("action",)
    readonly_fields = ("submission", "action", "actor", "note", "created_at")
