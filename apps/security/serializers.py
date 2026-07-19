
from rest_framework import serializers

from .models import DeviceSession


class DeviceSessionSerializer(serializers.ModelSerializer):
    network_type_display = serializers.CharField(
        source="get_network_type_display", read_only=True
    )

    class Meta:
        model = DeviceSession
        fields = [
            "id",
            "device_name",
            "device_model",
            "os_name",
            "os_version",
            "app_version",
            "ip_address",
            "network_type",
            "network_type_display",
            "location_label",
            "is_active",
            "created_at",
            "last_seen_at",
        ]
        read_only_fields = fields
