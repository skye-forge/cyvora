from django.contrib import admin

from .models import SupportAgentProfile, SupportMessage, SupportTicket


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    readonly_fields = ["id", "sender", "sender_role", "message", "is_ai_generated", "created_at"]
    can_delete = False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "category", "status", "auto_handled", "assigned_agent", "updated_at"]
    list_filter = ["status", "category", "auto_handled"]
    search_fields = ["id", "user__username", "user__email", "subject"]
    inlines = [SupportMessageInline]


@admin.register(SupportAgentProfile)
class SupportAgentProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "is_online", "max_concurrent_tickets"]
