from django.urls import path

from . import views

app_name = "learning"

urlpatterns = [
    # ── Courses (alias for zones) ──
    path("courses/", views.LearningZoneListView.as_view(), name="course-list"),
    path(
        "courses/<uuid:zone_id>/modules/",
        views.LearningModuleListView.as_view(),
        name="course-modules",
    ),
    # ── Zones (legacy) ──
    path("zones/", views.LearningZoneListView.as_view(), name="zone-list"),
    path(
        "zones/<uuid:zone_id>/modules/",
        views.LearningModuleListView.as_view(),
        name="zone-modules",
    ),
    # ── Modules ──
    path(
        "modules/<uuid:module_id>/lessons/",
        views.LessonListView.as_view(),
        name="module-lessons",
    ),
    # ── Lessons ──
    path(
        "lessons/<uuid:lesson_id>/parts/",
        views.LessonPartListView.as_view(),
        name="lesson-parts",
    ),
    path(
        "lessons/<uuid:lesson_id>/complete/",
        views.LessonCompleteView.as_view(),
        name="lesson-complete",
    ),
    path(
        "lessons/<uuid:lesson_id>/progress/",
        views.LessonProgressView.as_view(),
        name="lesson-progress",
    ),
    # ── Progress & Resume ──
    path("progress/", views.MyProgressView.as_view(), name="my-progress"),
    path("resume/", views.ResumeLearningView.as_view(), name="resume-learning"),
    # ── Leaderboard & Ranking ──
    path("leaderboard/", views.TopLearnersView.as_view(), name="leaderboard"),
    path("my-ranking/", views.MyRankingView.as_view(), name="my-ranking"),
    # ── Daily Tip ──
    path("daily-tip/", views.DailyTipView.as_view(), name="daily-tip"),
    # ── XP & Badges & Streak ──
    path("xp-history/", views.MyXpHistoryView.as_view(), name="xp-history"),
    path("my-badges/", views.MyBadgesView.as_view(), name="my-badges"),
    path("my-streak/", views.MyStreakView.as_view(), name="my-streak"),
    # ── Completion Status ──
    path(
        "completed-lessons/",
        views.CompletedLessonsView.as_view(),
        name="completed-lessons",
    ),
    path(
        "completed-modules/",
        views.CompletedModulesView.as_view(),
        name="completed-modules",
    ),
    path(
        "completed-zones/",
        views.CompletedZonesView.as_view(),
        name="completed-zones",
    ),
]
