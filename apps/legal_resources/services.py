from django.utils import timezone

from shared.mixins.audit_loggable import log_audit_action
from .models import LegalArticle


def create_article(*, actor, validated_data: dict) -> LegalArticle:
    article = LegalArticle.objects.create(
        **{k: v for k, v in validated_data.items() if k != "related_lessons"},
        last_updated_by=actor,
    )
    if "related_lessons" in validated_data:
        article.related_lessons.set(validated_data["related_lessons"])

    log_audit_action(
        actor, "legal_article.created", article, {"title": article.title_en}
    )
    return article


def update_article(
    *, actor, article: LegalArticle, validated_data: dict
) -> LegalArticle:
    """
    FR-LAW-06: any edit stamps last_updated_at (via auto_now) and
    last_updated_by server-side — the client can never set these directly
    since they aren't writable serializer fields.
    """
    related_lessons = validated_data.pop("related_lessons", None)

    for field, value in validated_data.items():
        setattr(article, field, value)
    article.last_updated_by = actor
    article.save()

    if related_lessons is not None:
        article.related_lessons.set(related_lessons)

    log_audit_action(
        actor, "legal_article.updated", article, {"fields": list(validated_data.keys())}
    )
    return article


def publish_article(*, actor, article: LegalArticle) -> LegalArticle:
    article.is_published = True
    article.last_updated_by = actor
    article.save(update_fields=["is_published", "last_updated_by", "updated_at"])
    log_audit_action(actor, "legal_article.published", article)
    return article
