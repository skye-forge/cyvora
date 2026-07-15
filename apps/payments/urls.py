from django.urls import path
from . import views

app_name = "payments"

urlpatterns = [
    path(
        "status/<str:transaction_ref>",
        views.PaymentStatusView.as_view(),
        name="payment-status",
    ),
    path(
        "webhooks/<str:provider>",
        views.PaymentWebhookView.as_view(),
        name="payment-webhook",
    ),
]
