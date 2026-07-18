from django.contrib import admin
from django.utils import timezone

from .models import PaymentConfiguration, PaymentSubmission, PaymentSubmissionStatus
from .services import approve_submission, reject_submission


@admin.register(PaymentConfiguration)
class PaymentConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "payment_method",
        "label",
        "account_name",
        "account_number",
        "is_active",
        "updated_at",
    )
    list_filter = ("payment_method", "is_active")
    search_fields = ("account_name", "account_number", "reference_code", "label")


@admin.register(PaymentSubmission)
class PaymentSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "purpose",
        "payment_configuration",
        "amount_declared",
        "status",
        "created_at",
    )
    list_filter = ("status", "purpose", "payment_configuration__payment_method")
    search_fields = ("payer_name", "payer_phone", "transaction_ref", "user__email")
    readonly_fields = ("created_at", "updated_at")
    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="Approve selected submissions")
    def approve_selected(self, request, queryset):
        approved = 0
        for submission in queryset:
            if submission.status in (
                PaymentSubmissionStatus.SUBMITTED,
                PaymentSubmissionStatus.UNDER_REVIEW,
            ):
                approve_submission(submission=submission, admin_user=request.user)
                approved += 1
        self.message_user(request, f"{approved} submission(s) approved.")

    @admin.action(description="Reject selected submissions (generic reason)")
    def reject_selected(self, request, queryset):
        rejected = 0
        for submission in queryset:
            if submission.status in (
                PaymentSubmissionStatus.SUBMITTED,
                PaymentSubmissionStatus.UNDER_REVIEW,
            ):
                reject_submission(
                    submission=submission,
                    admin_user=request.user,
                    reason="Rejected via bulk admin action — review individually for detail.",
                )
                rejected += 1
        self.message_user(request, f"{rejected} submission(s) rejected.")
