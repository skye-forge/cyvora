from django.contrib import admin

from .models import EmailLog
from .models import Notification

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ["recipient", "subject", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["recipient", "subject", "provider_message_id"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "category",
        "event",
        "is_read",
        "push_sent",
        "email_sent",
        "created_at",
    )
    list_filter = ("category", "is_read", "push_sent", "email_sent")
    search_fields = ("user__email", "event")
    readonly_fields = ("created_at",)
