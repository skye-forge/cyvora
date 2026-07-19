from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """VARNIS API v1 — available endpoints."""
    return Response({
        "auth": "/api/v1/auth/",
        "learning": "/api/v1/learning/",
        "quizzes": "/api/v1/quizzes/",
        "incidents": "/api/v1/incidents/",
        "certificates": "/api/v1/certificates/",
        "community": "/api/v1/community/",
        "dashboard": "/api/v1/dashboard/",
        "leaderboard": "/api/v1/leaderboard/",
        "kyc": "/api/v1/kyc/",
        "tracking": "/api/v1/tracking/",
        "national_updates": "/api/v1/national-update/",
        "webhooks": "/api/v1/webhooks/",
        "health": "/api/v1/health",
        "docs": "/api/docs/",
        "admin": "/admin/",
        "console": "/console/",
    })


urlpatterns = [
    path("", api_root, name="api-root"),
    path("auth/", include("apps.accounts.urls")),
    path("kyc/", include("apps.kyc.urls")),
    path("tracking/", include("apps.tracking.urls")),
    path("leaderboard/", include("apps.leaderboard.urls")),
    path("learning/", include("apps.learning.urls")),
    path("incidents/", include("apps.incidents.urls")),
    path("webhooks/", include("apps.notifications.urls")),
    path("certificates/", include("apps.certificates.urls")),
    path("dashboard/", include("apps.dashboard.urls")),
    path("community/", include("apps.community.urls")),
    path("national-update/", include("apps.national_update.urls")),
    path("quizzes/", include("apps.quizzes.urls")),
    path("health", health_check, name="health-check"),
]
