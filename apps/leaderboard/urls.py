from django.urls import path
from . import views

app_name = "leaderboard"

urlpatterns = [
    path("national", views.NationalLeaderboardView.as_view(), name="national"),
    path(
        "regional/<str:region>",
        views.RegionalLeaderboardView.as_view(),
        name="regional",
    ),
    path(
        "institution/<uuid:institution_id>",
        views.InstitutionLeaderboardView.as_view(),
        name="institution",
    ),
    path("my-ranking", views.MyRankingView.as_view(), name="my-ranking"),
]
