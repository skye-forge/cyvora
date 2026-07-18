from django.urls import path

from . import views

app_name = "kyc"

urlpatterns = [
    # Citizen-facing
    path(
        "submissions/",
        views.KYCSubmissionCreateView.as_view(),
        name="submission-create",
    ),
    path(
        "submissions/<uuid:id>/submit/",
        views.SubmitKYCForReviewView.as_view(),
        name="submission-submit",
    ),
    path("me/", views.MyKYCStatusView.as_view(), name="me"),
    path("history/", views.KYCSubmissionHistoryView.as_view(), name="history"),
    # Admin
    path("admin/submissions/", views.AdminKYCQueueView.as_view(), name="admin-queue"),
    path(
        "admin/submissions/<uuid:id>/",
        views.AdminKYCDetailView.as_view(),
        name="admin-detail",
    ),
    path(
        "admin/submissions/<uuid:id>/approve/",
        views.AdminApproveKYCView.as_view(),
        name="admin-approve",
    ),
    path(
        "admin/submissions/<uuid:id>/reject/",
        views.AdminRejectKYCView.as_view(),
        name="admin-reject",
    ),
]
