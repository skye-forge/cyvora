from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from api.responses import build_success_response_schema

from . import selectors, services
from .models import LegalTopic, LegalArticle
from .serializers import (
    LegalTopicSerializer,
    LegalArticleListSerializer,
    LegalArticleDetailSerializer,
    LegalArticleAdminSerializer,
)

# ---------- Public / citizen-facing (read-only) ----------


class LegalTopicListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LegalTopicSerializer
    queryset = LegalTopic.objects.filter(is_active=True)


class LegalArticleListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LegalArticleListSerializer

    def get_queryset(self):
        topic_slug = self.request.query_params.get("topic")
        query = self.request.query_params.get("q")

        if query:
            return selectors.search_articles(query)
        if topic_slug:
            return selectors.get_articles_for_topic(topic_slug)
        return selectors.published_articles()


class LegalArticleDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LegalArticleDetailSerializer
    queryset = LegalArticle.objects.filter(is_published=True)


class RelatedArticlesByIncidentCategoryView(APIView):
    """Called from the Report Incident flow — FR-LAW-05."""

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        responses={
            200: build_success_response_schema(
                serializers.ListSerializer(child=LegalArticleListSerializer())
            )
        }
    )
    def get(self, request, category_code):
        articles = selectors.get_articles_for_incident_category(category_code)
        serializer = LegalArticleListSerializer(articles, many=True)
        return Response({"success": True, "results": serializer.data})


# ---------- Admin (legal editor) — imported into admin_console/urls.py ----------


class AdminLegalArticleListCreateView(generics.ListCreateAPIView):
    from shared.permissions.roles import IsLegalEditor

    permission_classes = [IsLegalEditor]
    serializer_class = LegalArticleAdminSerializer
    queryset = LegalArticle.objects.all()

    def perform_create(self, serializer):
        services.create_article(
            actor=self.request.user, validated_data=serializer.validated_data
        )


class AdminLegalArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    from shared.permissions.roles import IsLegalEditor

    permission_classes = [IsLegalEditor]
    serializer_class = LegalArticleAdminSerializer
    queryset = LegalArticle.objects.all()

    def perform_update(self, serializer):
        services.update_article(
            actor=self.request.user,
            article=self.get_object(),
            validated_data=serializer.validated_data,
        )


class AdminLegalArticlePublishView(APIView):
    from shared.permissions.roles import IsLegalEditor

    permission_classes = [IsLegalEditor]

    @extend_schema(
        responses={200: build_success_response_schema(serializers.DictField())}
    )
    def post(self, request, pk):
        article = LegalArticle.objects.get(pk=pk)
        article = services.publish_article(actor=request.user, article=article)
        return Response({"success": True, "is_published": article.is_published})
