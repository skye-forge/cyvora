
# Captures device/session info at login for the "Logged in Devices" screen
# (Profile > Security) and for security investigation per audit requirements.

import uuid

from django.conf import settings
from django.db import models


class NetworkType(models.TextChoices):
    WIFI = "WIFI", "WiFi"
    MOBILE_DATA = "MOBILE_DATA", "Mobile Data"
    UNKNOWN = "UNKNOWN", "Unknown"


class DeviceSession(models.Model):
    """
    One row per login. Not deleted on logout — status moves to revoked so
    the record stays available for security investigation (matches the
    project-wide "audit trail cannot be deleted" rule). Correlated to a
    specific JWT refresh token via refresh_token_jti so a single device
    can be logged out without invalidating the user's other sessions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_sessions",
    )

    # --- Device / client info ---
    device_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Human label shown in the UI, e.g. 'Chrome on Windows', 'Android App'.",
    )
    device_model = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g. 'Samsung Galaxy A14' — sent by Flutter client, blank for web.",
    )
    os_name = models.CharField(max_length=50, blank=True)
    os_version = models.CharField(max_length=30, blank=True)
    app_version = models.CharField(max_length=30, blank=True)
    user_agent = models.TextField(blank=True)

    # --- Network / location info ---
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    network_type = models.CharField(
        max_length=15, choices=NetworkType.choices, default=NetworkType.UNKNOWN
    )
    location_label = models.CharField(
        max_length=150,
        blank=True,
        help_text="e.g. 'Yaoundé, Cameroon' — populate later via IP geolocation lookup if added.",
    )

    # --- Session correlation ---
    refresh_token_jti = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        help_text="JTI of the SimpleJWT refresh token issued at login, for targeted revocation.",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)  # login time
    last_seen_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-last_seen_at"]
        verbose_name = "Device Session"
        verbose_name_plural = "Device Sessions"
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["ip_address"]),
        ]

    def __str__(self):
        return f"{self.user_id} — {self.device_name or 'Unknown device'} ({self.ip_address})"
