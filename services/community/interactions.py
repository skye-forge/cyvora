from django.db.models import F

from apps.community.models import CommunityPost, PostComment, PostLike, PostReport
from shared.exceptions import ValidationFailedError

from .moderation import needs_human_review


def publish_tip(
    *, user, content: str, tags: list, media_url: str = ""
) -> CommunityPost:
    flagged = needs_human_review(content)
    return CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_TIP,
        author=user,
        content=content,
        tags=tags,
        media_url=media_url,
        moderation_status=(
            CommunityPost.MODERATION_PENDING
            if flagged
            else CommunityPost.MODERATION_APPROVED
        ),
    )


def toggle_like(*, user, post: CommunityPost) -> bool:
    """Returns True if the post is now liked, False if unliked."""
    like, created = PostLike.objects.get_or_create(post=post, user=user)
    if not created:
        like.delete()
        CommunityPost.objects.filter(id=post.id).update(
            likes_count=F("likes_count") - 1
        )
        return False

    CommunityPost.objects.filter(id=post.id).update(likes_count=F("likes_count") + 1)
    return True


def add_comment(*, user, post: CommunityPost, content: str) -> PostComment:
    comment = PostComment.objects.create(post=post, author=user, content=content)
    CommunityPost.objects.filter(id=post.id).update(
        comments_count=F("comments_count") + 1
    )
    return comment


def report_post(*, user, post: CommunityPost, reason: str = "") -> PostReport:
    if PostReport.objects.filter(post=post, reporter=user).exists():
        raise ValidationFailedError("You have already reported this post.")

    report = PostReport.objects.create(post=post, reporter=user, reason=reason)
    CommunityPost.objects.filter(id=post.id).update(
        reports_count=F("reports_count") + 1
    )
    return report
