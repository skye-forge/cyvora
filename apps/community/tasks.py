from celery import shared_task


@shared_task
def run_automated_moderation_check(post_id: str):
    """
    FR-COM-04: automated keyword/image screening on a newly-created Tip.
    Result is either AUTO_APPROVED (visible immediately) or FLAGGED
    (escalated to the human moderation queue).
    """
    from integrations.moderation.keyword_screen import screen_text
    from integrations.moderation.image_screen import screen_image
    from .models import CommunityPost
    from .services import apply_automated_screening_result

    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        return

    text_flagged, matched_terms = screen_text(post.content)
    image_flagged, image_reason = screen_image(post.media_url)

    is_flagged = text_flagged or image_flagged
    reasons = []
    if text_flagged:
        reasons.append(f"blocked terms: {', '.join(matched_terms)}")
    if image_flagged:
        reasons.append(f"image: {image_reason}")

    apply_automated_screening_result(
        post=post, is_flagged=is_flagged, reason="; ".join(reasons)
    )
