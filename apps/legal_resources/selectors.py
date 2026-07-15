from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import QuerySet

from .models import LegalArticle


def published_articles() -> QuerySet[LegalArticle]:
    return LegalArticle.objects.filter(is_published=True, topic__is_active=True)


def get_articles_for_topic(topic_slug: str) -> QuerySet[LegalArticle]:
    return published_articles().filter(topic__slug=topic_slug)


def search_articles(query: str) -> QuerySet[LegalArticle]:
    """
    Postgres full-text search across bilingual title/summary fields.
    Falls back gracefully to an empty queryset on blank input.
    """
    if not query or not query.strip():
        return LegalArticle.objects.none()

    vector = SearchVector("title_en", "title_fr", "summary_body_en", "summary_body_fr")
    search_query = SearchQuery(query)

    return (
        published_articles()
        .annotate(rank=SearchRank(vector, search_query))
        .filter(rank__gt=0)
        .order_by("-rank")
    )


def get_articles_for_incident_category(category_code: str) -> QuerySet[LegalArticle]:
    """
    Called by the Incidents app when building the Report Incident payload,
    per FR-LAW-05. Cross-app read via selector, not a direct FK.
    """
    return published_articles().filter(
        related_incident_categories__contains=[category_code]
    )
