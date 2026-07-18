from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    # Citizen-facing
    path(
        "config/active/",
        views.ActivePaymentConfigurationView.as_view(),
        name="active-config",
    ),
    path(
        "submissions/",
        views.PaymentSubmissionCreateView.as_view(),
        name="submission-create",
    ),
    path(
        "submissions/mine/",
        views.MyPaymentSubmissionsView.as_view(),
        name="submission-mine",
    ),
    path(
        "submissions/<uuid:id>/",
        views.PaymentSubmissionDetailView.as_view(),
        name="submission-detail",
    ),
    path(
        "submissions/<uuid:id>/resubmit/",
        views.ResubmitProofView.as_view(),
        name="submission-resubmit",
    ),
    # Admin / finance
    path(
        "admin/config/",
        views.AdminPaymentConfigurationViewSet.as_view(),
        name="admin-config-list-create",
    ),
    path(
        "admin/submissions/",
        views.AdminPaymentSubmissionQueueView.as_view(),
        name="admin-submission-queue",
    ),
    path(
        "admin/submissions/<uuid:id>/approve/",
        views.ApproveSubmissionView.as_view(),
        name="admin-submission-approve",
    ),
    path(
        "admin/submissions/<uuid:id>/reject/",
        views.RejectSubmissionView.as_view(),
        name="admin-submission-reject",
    ),
    path(
        "admin/submissions/<uuid:id>/request-proof/",
        views.RequestProofView.as_view(),
        name="admin-submission-request-proof",
    ),
]
