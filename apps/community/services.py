from django.db import transaction
from django.db.models import F

# from shared.exceptions import AppException, NotFoundError
from shared.mixins.audit_loggable import log_audit_action
from shared.constants.community import CommunityPostType, ModerationStatus

from .models import (
    CommunityPost,
    CommunityComment,
    CommunityLike,
    CommunityContentReport,
)

# ---------- Post creation ----------


def create_alert_from_report(report) -> CommunityPost:
    """
    FR-MOD-03: called by admin_console.services.review_report() when a
    report is approved. Already moderator-reviewed upstream, so it goes
    straight to AUTO_APPROVED — no automated screening needed twice.
    Reporter identity withheld by default (NFR-03): author=None.
    """
    post = CommunityPost.objects.create(
        type=CommunityPostType.ALERT,
        source_report=report,
        author=None,
        content=report.description,
        tags=[f"#{report.category.replace('_', '').title()}Alert"],
        moderation_status=ModerationStatus.AUTO_APPROVED,
    )
    log_audit_action(
        None, "community_post.alert_created", post, {"source_report": str(report.id)}
    )
    return post


def publish_tip(
    *, actor, content: str, media_url: str = "", tags: list | None = None
) -> CommunityPost:
    """
    FR-COM-03/04: user-submitted Tip. Starts PENDING and goes through
    automated screening before becoming publicly visible.
    """
    post = CommunityPost.objects.create(
        type=CommunityPostType.TIP,
        author=actor,
        content=content,
        media_url=media_url,
        tags=tags or [],
        moderation_status=ModerationStatus.PENDING,
    )

    from .tasks import run_automated_moderation_check

    run_automated_moderation_check.delay(str(post.id))

    return post


# ---------- Automated + human moderation ----------


def apply_automated_screening_result(
    *, post: CommunityPost, is_flagged: bool, reason: str = ""
) -> CommunityPost:
    post.moderation_status = (
        ModerationStatus.FLAGGED if is_flagged else ModerationStatus.AUTO_APPROVED
    )
    post.moderation_reason = reason
    post.save(update_fields=["moderation_status", "moderation_reason", "updated_at"])

    log_audit_action(
        None,
        "community_post.auto_screened",
        post,
        {"result": post.moderation_status, "reason": reason},
    )
    return post


def moderate_post(
    *, actor, post: CommunityPost, decision: str, reason: str = ""
) -> CommunityPost:
    """
    Human moderator resolves a FLAGGED post (escalated by automated
    screening) or a post surfaced via a user content report.
    decision: "approved" | "rejected"
    """
    if decision not in (ModerationStatus.APPROVED, ModerationStatus.REJECTED):
        raise AppException(
            "decision must be 'approved' or 'rejected'.", code="invalid_decision"
        )

    post.moderation_status = decision
    post.moderation_reason = reason
    post.moderated_by = actor
    post.save(
        update_fields=[
            "moderation_status",
            "moderation_reason",
            "moderated_by",
            "updated_at",
        ]
    )

    log_audit_action(actor, f"community_post.{decision}", post, {"reason": reason})
    return post


# ---------- Engagement (FR-COM-05) ----------


@transaction.atomic
def like_post(*, actor, post: CommunityPost) -> bool:
    """Returns True if a like was created, False if it already existed (idempotent toggle-on)."""
    _, created = CommunityLike.objects.get_or_create(post=post, user=actor)
    if created:
        CommunityPost.objects.filter(pk=post.pk).update(
            likes_count=F("likes_count") + 1
        )
    return created


@transaction.atomic
def unlike_post(*, actor, post: CommunityPost) -> bool:
    deleted, _ = CommunityLike.objects.filter(post=post, user=actor).delete()
    if deleted:
        CommunityPost.objects.filter(pk=post.pk).update(
            likes_count=F("likes_count") - 1
        )
    return bool(deleted)


@transaction.atomic
def add_comment(*, actor, post: CommunityPost, content: str) -> CommunityComment:
    comment = CommunityComment.objects.create(post=post, author=actor, content=content)
    CommunityPost.objects.filter(pk=post.pk).update(
        comments_count=F("comments_count") + 1
    )
    return comment


# ---------- Reporting inappropriate content (FR-COM-06) ----------


def report_content(
    *, actor, post: CommunityPost, reason: str
) -> CommunityContentReport:
    report = CommunityContentReport.objects.create(
        post=post, reporter=actor, reason=reason
    )
    log_audit_action(actor, "community_post.reported_by_user", post, {"reason": reason})
    return report


def resolve_content_report(
    *,
    actor,
    content_report: CommunityContentReport,
    decision: str,
    mod_reason: str = "",
) -> CommunityContentReport:
    post = moderate_post(
        actor=actor, post=content_report.post, decision=decision, reason=mod_reason
    )
    content_report.status = "reviewed"
    content_report.reviewed_by = actor
    content_report.save(update_fields=["status", "reviewed_by", "updated_at"])
    return content_report
