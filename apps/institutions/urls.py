from django.urls import path
from . import views

app_name = "institutions"

urlpatterns = [
    path(
        "register", views.InstitutionRegisterView.as_view(), name="institution-register"
    ),
    path("mine", views.MyInstitutionsListView.as_view(), name="my-institutions"),
    path(
        "license-pricing",
        views.LicensePricingListView.as_view(),
        name="license-pricing",
    ),
    path(
        "<uuid:pk>/license/purchase",
        views.InstitutionLicensePurchaseView.as_view(),
        name="license-purchase",
    ),
    path(
        "<uuid:pk>/users",
        views.InstitutionMembersView.as_view(),
        name="institution-members",
    ),
    path(
        "<uuid:pk>/invite",
        views.InstitutionEnrollView.as_view(),
        name="institution-enroll",
    ),
    path(
        "<uuid:pk>/progress",
        views.InstitutionProgressView.as_view(),
        name="institution-progress",
    ),
]
