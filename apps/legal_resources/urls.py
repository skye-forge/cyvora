from django.urls import path
from . import views

app_name = "legal_resources"

urlpatterns = [
    path("topics", views.LegalTopicListView.as_view(), name="topic-list"),
    path("articles", views.LegalArticleListView.as_view(), name="article-list"),
    path(
        "articles/<uuid:pk>",
        views.LegalArticleDetailView.as_view(),
        name="article-detail",
    ),
    path(
        "articles/related-incident-category/<str:category_code>",
        views.RelatedArticlesByIncidentCategoryView.as_view(),
        name="article-by-incident-category",
    ),
]
