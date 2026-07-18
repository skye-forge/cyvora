from django.contrib import admin

from .models import (
    TrackingRequest,
    ElectronicDevice,
    Vehicle,
    OwnershipVerification,
    AuthorityCase,
    Evidence,
    EvidenceRequest,
    TimelineEvent,
)


class DeviceInline(admin.StackedInline):
    model = ElectronicDevice
    extra = 0


class VehicleInline(admin.StackedInline):
    model = Vehicle
    extra = 0


class OwnershipVerificationInline(admin.StackedInline):
    model = OwnershipVerification
    extra = 0
    readonly_fields = ("verified_by", "verified_at")


class AuthorityCaseInline(admin.TabularInline):
    model = AuthorityCase
    extra = 0


class TimelineEventInline(admin.TabularInline):
    model = TimelineEvent
    extra = 0
    readonly_fields = ("event_type", "description", "created_by", "created_at")
    can_delete = False


@admin.register(TrackingRequest)
class TrackingRequestAdmin(admin.ModelAdmin):
    list_display = ("reference_code", "user", "category", "status", "created_at")
    list_filter = ("status", "category")
    search_fields = ("reference_code", "user__email")
    readonly_fields = ("reference_code", "created_at", "updated_at", "closed_at")
    inlines = [
        DeviceInline,
        VehicleInline,
        OwnershipVerificationInline,
        AuthorityCaseInline,
        TimelineEventInline,
    ]


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ("tracking_request", "description", "uploaded_by", "created_at")
    search_fields = ("tracking_request__reference_code",)


@admin.register(EvidenceRequest)
class EvidenceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "tracking_request",
        "status",
        "requested_by",
        "created_at",
        "fulfilled_at",
    )
    list_filter = ("status",)
