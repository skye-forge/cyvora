from django.contrib import admin

from .models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ["recipient", "subject", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["recipient", "subject", "provider_message_id"]
    readonly_fields = ["created_at", "updated_at"]
