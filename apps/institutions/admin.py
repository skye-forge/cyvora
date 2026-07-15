from django.contrib import admin
from .models import Institution, InstitutionMembership, InstitutionLicensePricing


@admin.register(InstitutionLicensePricing)
class InstitutionLicensePricingAdmin(admin.ModelAdmin):
    list_display = ["tier", "amount", "currency", "seat_limit", "is_active"]


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "region", "subscription_tier", "expires_at"]
    list_filter = ["type", "subscription_tier"]
    search_fields = ["name"]


@admin.register(InstitutionMembership)
class InstitutionMembershipAdmin(admin.ModelAdmin):
    list_display = ["institution", "user", "role", "created_at"]
    list_filter = ["role"]
