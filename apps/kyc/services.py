"""
Anything that changes a KYCSubmission's status, or
that needs to know "is this user verified right now", goes through here.
Other apps (tracking, ownership verification) should call is_user_verified()
rather than querying KYCSubmission directly, so the definition of "verified"
stays in one place.
"""

from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import KYCSubmission, KYCStatus, KYCAuditLog

KYC_VALIDITY_PERIOD = timedelta(days=365)


class KYCError(Exception):
    pass


def get_latest_submission(user):
    return KYCSubmission.objects.filter(user=user, is_latest=True).first()


def is_user_verified(user) -> bool:
    latest = get_latest_submission(user)
    if not latest or latest.status != KYCStatus.APPROVED:
        return False
    if latest.expires_at and latest.expires_at < timezone.now():
        return False
    return True


@transaction.atomic
def create_submission(*, user, **fields) -> KYCSubmission:
    """
    Creates a new submission. If the user has an existing latest submission
    that is not in a final APPROVED state, this is treated as a resubmission:
    the old one is kept (is_latest=False) and linked via `supersedes`.
    """
    previous = get_latest_submission(user)

    if previous and previous.status == KYCStatus.APPROVED and is_user_verified(user):
        raise KYCError("User already has an approved, unexpired KYC record.")

    if previous:
        previous.is_latest = False
        previous.save(update_fields=["is_latest"])

    submission = KYCSubmission.objects.create(
        user=user,
        is_latest=True,
        supersedes=previous,
        status=KYCStatus.DRAFT,
        **fields,
    )
    action = "RESUBMITTED" if previous else "CREATED"
    _log(submission, action, user)
    return submission


def submit_for_review(*, submission: KYCSubmission) -> KYCSubmission:
    if submission.status != KYCStatus.DRAFT:
        raise KYCError(f"Cannot submit from status {submission.status}.")
    submission.status = KYCStatus.SUBMITTED
    submission.save(update_fields=["status", "updated_at"])
    _log(submission, "SUBMITTED", submission.user)
    _notify(submission, "kyc_submitted")
    return submission


def mark_under_review(*, submission: KYCSubmission, admin_user) -> KYCSubmission:
    if submission.status != KYCStatus.SUBMITTED:
        raise KYCError(f"Cannot review from status {submission.status}.")
    submission.status = KYCStatus.UNDER_REVIEW
    submission.reviewed_by = admin_user
    submission.save(update_fields=["status", "reviewed_by", "updated_at"])
    _log(submission, "UNDER_REVIEW", admin_user)
    return submission


def approve_submission(*, submission: KYCSubmission, admin_user) -> KYCSubmission:
    if submission.status not in (KYCStatus.SUBMITTED, KYCStatus.UNDER_REVIEW):
        raise KYCError(f"Cannot approve from status {submission.status}.")
    submission.status = KYCStatus.APPROVED
    submission.reviewed_by = admin_user
    submission.reviewed_at = timezone.now()
    submission.expires_at = timezone.now() + KYC_VALIDITY_PERIOD
    submission.save(
        update_fields=[
            "status",
            "reviewed_by",
            "reviewed_at",
            "expires_at",
            "updated_at",
        ]
    )
    _log(submission, "APPROVED", admin_user)
    _notify(submission, "kyc_approved")
    return submission


def reject_submission(
    *, submission: KYCSubmission, admin_user, reason: str
) -> KYCSubmission:
    if submission.status not in (KYCStatus.SUBMITTED, KYCStatus.UNDER_REVIEW):
        raise KYCError(f"Cannot reject from status {submission.status}.")
    if not reason:
        raise KYCError("A rejection reason is required.")
    submission.status = KYCStatus.REJECTED
    submission.reviewed_by = admin_user
    submission.reviewed_at = timezone.now()
    submission.rejection_reason = reason
    submission.save(
        update_fields=[
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "updated_at",
        ]
    )
    _log(submission, "REJECTED", admin_user, note=reason)
    _notify(submission, "kyc_rejected")
    return submission


def expire_stale_submissions() -> int:
    """Intended to run as a periodic Celery task."""
    stale = KYCSubmission.objects.filter(
        status=KYCStatus.APPROVED, is_latest=True, expires_at__lt=timezone.now()
    )
    count = 0
    for submission in stale:
        submission.status = KYCStatus.EXPIRED
        submission.save(update_fields=["status", "updated_at"])
        _log(submission, "EXPIRED", actor=None)
        _notify(submission, "kyc_expired")
        count += 1
    return count


def _log(submission: KYCSubmission, action: str, actor, note: str = "") -> None:
    KYCAuditLog.objects.create(
        submission=submission, action=action, actor=actor, note=note
    )


def _notify(submission: KYCSubmission, event: str) -> None:
    from notifications.services import notify_user

    notify_user(
        user=submission.user,
        event=event,
        context={
            "submission_id": str(submission.id),
            "status": submission.status,
        },
    )
