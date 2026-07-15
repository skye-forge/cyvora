from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views as console_views
from apps.legal_resources import views as legal_views
from apps.national_update import views as national_views
from apps.audit import views as audit_views
from apps.community import views as community_views
from apps.learning.views import (
    AdminZoneViewSet,
    AdminModuleViewSet,
    AdminLessonViewSet,
    AdminLessonPartViewSet,
    AdminDailyTipViewSet,
)

app_name = "admin_console"

router = DefaultRouter()
router.register(r"zones", AdminZoneViewSet, basename="console-zones")
router.register(r"modules", AdminModuleViewSet, basename="console-modules")
router.register(r"lessons", AdminLessonViewSet, basename="console-lessons")
router.register(r"lesson-parts", AdminLessonPartViewSet, basename="console-lesson-parts")
router.register(r"daily-tips", AdminDailyTipViewSet, basename="console-daily-tips")

urlpatterns = [
    # Incident moderation
    path(
        "moderation/queue",
        console_views.ModerationQueueView.as_view(),
        name="moderation-queue",
    ),
    path(
        "moderation/reports/<uuid:pk>/review",
        console_views.ModerationReviewView.as_view(),
        name="moderation-review",
    ),
    # Legal content editor
    path(
        "legal/articles",
        legal_views.AdminLegalArticleListCreateView.as_view(),
        name="legal-article-list-create",
    ),
    path(
        "legal/articles/<uuid:pk>",
        legal_views.AdminLegalArticleDetailView.as_view(),
        name="legal-article-detail",
    ),
    path(
        "legal/articles/<uuid:pk>/publish",
        legal_views.AdminLegalArticlePublishView.as_view(),
        name="legal-article-publish",
    ),
    # National updates publisher
    path(
        "national-updates",
        national_views.AdminNationalUpdateListCreateView.as_view(),
        name="national-update-list-create",
    ),
    path(
        "national-updates/<uuid:pk>",
        national_views.AdminNationalUpdateDetailView.as_view(),
        name="national-update-detail",
    ),
    path(
        "national-updates/<uuid:pk>/publish",
        national_views.AdminNationalUpdatePublishView.as_view(),
        name="national-update-publish",
    ),
    # Audit trail
    path("audit-logs", audit_views.AuditLogListView.as_view(), name="audit-log-list"),
    # Community moderation
    path(
        "community/moderation-queue",
        community_views.CommunityModerationQueueView.as_view(),
        name="community-moderation-queue",
    ),
    path(
        "community/content-reports",
        community_views.CommunityContentReportQueueView.as_view(),
        name="community-content-reports",
    ),
    path(
        "community/posts/<uuid:pk>/decision",
        community_views.CommunityModerationDecisionView.as_view(),
        name="community-moderation-decision",
    ),
    path(
        "community/content-reports/<uuid:pk>/resolve",
        community_views.CommunityContentReportResolveView.as_view(),
        name="community-content-report-resolve",
    ),
]

urlpatterns += router.urls
