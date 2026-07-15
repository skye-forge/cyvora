"""FR-MOD-03: approving an Incident auto-generates a public Community
Alert, tagged with the category hashtag + general locality, with the
reporter's identity withheld by default (NFR-03)."""

from apps.community.models import CommunityPost


def generate_alert_from_incident(incident, custom_content: str = None) -> CommunityPost:
    """custom_content lets a moderator redact/rewrite sensitive details
    before publishing (FR-MOD-04) instead of using the raw report text."""
    hashtag = "#" + "".join(ch for ch in incident.category.name if ch.isalnum())
    content = custom_content or (
        f"A {incident.category.name} incident was reported and verified. "
        f"Stay alert. {incident.description[:200]}"
    )

    return CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_ALERT,
        source_report=incident,
        author=None,  # system-generated — reporter identity withheld by default
        content=content,
        tags=[hashtag],
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )
