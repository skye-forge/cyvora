from django.urls import path
from . import views

app_name = "community"

urlpatterns = [
    path("feed", views.CommunityFeedListView.as_view(), name="feed"),
    path("tips", views.TipCreateView.as_view(), name="tip-create"),
    path(
        "posts/<uuid:pk>/comments",
        views.PostCommentListCreateView.as_view(),
        name="post-comments",
    ),
    path("posts/<uuid:pk>/like", views.PostLikeToggleView.as_view(), name="post-like"),
    path("posts/<uuid:pk>/report", views.PostReportView.as_view(), name="post-report"),
]
