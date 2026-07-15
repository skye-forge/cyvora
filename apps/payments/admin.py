from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "transaction_ref",
        "user",
        "purpose",
        "amount",
        "provider",
        "status",
        "created_at",
    ]
    list_filter = ["status", "provider", "purpose"]
    search_fields = [
        "transaction_ref",
        "user__email",
        "user__phone",
        "provider_reference",
    ]
    readonly_fields = ["transaction_ref", "created_at", "updated_at"]
