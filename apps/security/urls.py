
from django.urls import path

from . import views

app_name = "security"

urlpatterns = [
    path("sessions/mine/", views.MyDeviceSessionsView.as_view(), name="sessions-mine"),
    path(
        "sessions/<uuid:id>/revoke/",
        views.RevokeDeviceSessionView.as_view(),
        name="session-revoke",
    ),
    path(
        "sessions/revoke-all/",
        views.RevokeAllDeviceSessionsView.as_view(),
        name="session-revoke-all",
    ),
    path(
        "admin/sessions/",
        views.AdminUserDeviceSessionsView.as_view(),
        name="admin-sessions",
    ),
]
