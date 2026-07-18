from django.urls import path

from . import views

app_name = "tracking"

urlpatterns = [
    # Citizen-facing
    path("requests/", views.TrackingRequestCreateView.as_view(), name="request-create"),
    path("requests/mine/", views.MyTrackingRequestsView.as_view(), name="request-mine"),
    path(
        "requests/<uuid:id>/",
        views.TrackingRequestDetailView.as_view(),
        name="request-detail",
    ),
    path(
        "requests/<uuid:id>/initiate-payment/",
        views.InitiatePaymentView.as_view(),
        name="request-initiate-payment",
    ),
    path(
        "requests/<uuid:id>/cancel/",
        views.CancelTrackingRequestView.as_view(),
        name="request-cancel",
    ),
    path(
        "requests/<uuid:id>/evidence/",
        views.AddEvidenceView.as_view(),
        name="request-add-evidence",
    ),
    path(
        "evidence-requests/<uuid:id>/fulfill/",
        views.FulfillEvidenceRequestView.as_view(),
        name="evidence-request-fulfill",
    ),
    # Admin
    path("admin/requests/", views.AdminTrackingQueueView.as_view(), name="admin-queue"),
    path(
        "admin/requests/<uuid:id>/",
        views.AdminTrackingDetailView.as_view(),
        name="admin-detail",
    ),
    path(
        "admin/requests/<uuid:id>/ownership-verification/",
        views.AdminSubmitOwnershipVerificationView.as_view(),
        name="admin-ownership-verify",
    ),
    path(
        "admin/requests/<uuid:id>/assign-authority/",
        views.AdminAssignAuthorityView.as_view(),
        name="admin-assign-authority",
    ),
    path(
        "admin/requests/<uuid:id>/mark-under-investigation/",
        views.AdminMarkUnderInvestigationView.as_view(),
        name="admin-mark-investigation",
    ),
    path(
        "admin/requests/<uuid:id>/mark-located/",
        views.AdminMarkLocatedView.as_view(),
        name="admin-mark-located",
    ),
    path(
        "admin/requests/<uuid:id>/mark-recovered/",
        views.AdminMarkRecoveredView.as_view(),
        name="admin-mark-recovered",
    ),
    path(
        "admin/requests/<uuid:id>/close/",
        views.AdminCloseCaseView.as_view(),
        name="admin-close",
    ),
    path(
        "admin/requests/<uuid:id>/request-evidence/",
        views.AdminCreateEvidenceRequestView.as_view(),
        name="admin-request-evidence",
    ),
]
