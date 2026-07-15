
from django.db.models import Q, QuerySet

from shared.constants.community import ModerationStatus
from .models import CommunityPost, CommunityContentReport


def visible_feed() -> QuerySet[CommunityPost]:
    return CommunityPost.objects.filter(
        moderation_status__in=ModerationStatus.VISIBLE_STATUSES
    ).select_related("author")


def get_feed(
    *, tag: str | None = None, query: str | None = None
) -> QuerySet[CommunityPost]:
    qs = visible_feed()

    if tag and tag != "all":
        qs = qs.filter(tags__contains=[tag])

    if query:
        qs = qs.filter(content__icontains=query)

    return qs


def flagged_queue() -> QuerySet[CommunityPost]:
    """Human moderation queue — posts escalated by automated screening (FR-COM-04)."""
    return CommunityPost.objects.filter(
        moderation_status=ModerationStatus.FLAGGED
    ).order_by("created_at")


def pending_content_reports() -> QuerySet[CommunityContentReport]:
    """User-filed reports awaiting moderator review (FR-COM-06)."""
    return CommunityContentReport.objects.filter(status="pending").select_related(
        "post", "reporter"
    )
