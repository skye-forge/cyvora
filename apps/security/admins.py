
from django.contrib import admin

from .models import DeviceSession


@admin.register(DeviceSession)
class DeviceSessionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "device_name",
        "device_model",
        "ip_address",
        "network_type",
        "is_active",
        "created_at",
        "last_seen_at",
    )
    list_filter = ("is_active", "network_type", "os_name")
    search_fields = ("user__email", "ip_address", "device_model", "device_name")
    readonly_fields = ("created_at", "last_seen_at")
