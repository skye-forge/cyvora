
from django.urls import path
from . import views

app_name = "certificates"

urlpatterns = [
    path(
        "pricing/<uuid:course_id>",
        views.CertificatePricingView.as_view(),
        name="certificate-pricing",
    ),
    path(
        "purchase",
        views.CertificateInitiatePurchaseView.as_view(),
        name="certificate-purchase",
    ),
    path("mine", views.MyCertificatesListView.as_view(), name="my-certificates"),
    path(
        "verify/<str:cert_code>",
        views.CertificateVerifyPublicView.as_view(),
        name="certificate-verify",
    ),
]
