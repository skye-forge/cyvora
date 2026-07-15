from django.contrib import admin
from .models import Certificate, CertificatePricing


@admin.register(CertificatePricing)
class CertificatePricingAdmin(admin.ModelAdmin):
    list_display = ["tier", "amount", "currency", "is_active", "updated_at"]
    list_filter = ["is_active", "currency"]


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ["cert_code", "user", "tier", "issued_at", "expires_at"]
    list_filter = ["tier"]
    search_fields = ["cert_code", "user__email", "user__phone"]
    readonly_fields = ["cert_code", "issued_at"]
