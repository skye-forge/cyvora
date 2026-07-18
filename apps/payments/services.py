"""

Views should never touch model state transitions directly — everything
that moves a PaymentSubmission from one status to another goes through
here so it stays auditable and so the "unlock" hook has exactly one
place to live. When a real payment gateway is wired in later, its
webhook handler should call approve_submission() too, not duplicate
this logic.
"""

from django.utils import timezone
from django.db import transaction

from .models import PaymentSubmission, PaymentSubmissionStatus, PaymentPurpose


class PaymentSubmissionError(Exception):
    pass


def submit_proof(*, submission: PaymentSubmission) -> PaymentSubmission:
    """Move PENDING -> SUBMITTED once proof has been attached."""
    if submission.status != PaymentSubmissionStatus.PENDING:
        raise PaymentSubmissionError(
            f"Cannot submit proof from status {submission.status}."
        )
    if not submission.proof_file:
        raise PaymentSubmissionError("Proof file is required before submission.")

    submission.status = PaymentSubmissionStatus.SUBMITTED
    submission.save(update_fields=["status", "updated_at"])
    _mark_related_payment_submitted(submission)
    _notify(submission, "payment_submitted")
    return submission


def mark_under_review(
    *, submission: PaymentSubmission, admin_user
) -> PaymentSubmission:
    if submission.status != PaymentSubmissionStatus.SUBMITTED:
        raise PaymentSubmissionError(f"Cannot review from status {submission.status}.")
    submission.status = PaymentSubmissionStatus.UNDER_REVIEW
    submission.reviewed_by = admin_user
    submission.save(update_fields=["status", "reviewed_by", "updated_at"])
    return submission


@transaction.atomic
def approve_submission(
    *, submission: PaymentSubmission, admin_user
) -> PaymentSubmission:
    """
    Single trigger point for unlocking whatever this payment was for.
    Extend _unlock_related_object() as new purposes are added.
    """
    if submission.status not in (
        PaymentSubmissionStatus.SUBMITTED,
        PaymentSubmissionStatus.UNDER_REVIEW,
    ):
        raise PaymentSubmissionError(f"Cannot approve from status {submission.status}.")

    submission.status = PaymentSubmissionStatus.VERIFIED
    submission.reviewed_by = admin_user
    submission.reviewed_at = timezone.now()
    submission.save(
        update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"]
    )

    _unlock_related_object(submission)
    _notify(submission, "payment_verified")
    return submission


def reject_submission(
    *, submission: PaymentSubmission, admin_user, reason: str
) -> PaymentSubmission:
    if submission.status not in (
        PaymentSubmissionStatus.SUBMITTED,
        PaymentSubmissionStatus.UNDER_REVIEW,
    ):
        raise PaymentSubmissionError(f"Cannot reject from status {submission.status}.")
    if not reason:
        raise PaymentSubmissionError("A rejection reason is required.")

    submission.status = PaymentSubmissionStatus.REJECTED
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
    _notify(submission, "payment_rejected")
    return submission


def request_new_proof(
    *, submission: PaymentSubmission, admin_user, message: str
) -> PaymentSubmission:
    if submission.status not in (
        PaymentSubmissionStatus.SUBMITTED,
        PaymentSubmissionStatus.UNDER_REVIEW,
    ):
        raise PaymentSubmissionError(
            f"Cannot request proof from status {submission.status}."
        )

    submission.status = PaymentSubmissionStatus.PROOF_REQUESTED
    submission.reviewed_by = admin_user
    submission.proof_request_message = message
    submission.save(
        update_fields=[
            "status",
            "reviewed_by",
            "proof_request_message",
            "updated_at",
        ]
    )
    _notify(submission, "payment_proof_requested")
    return submission


def resubmit_proof(
    *, submission: PaymentSubmission, new_proof_file
) -> PaymentSubmission:
    """User re-uploads after a PROOF_REQUESTED, without losing history."""
    if submission.status != PaymentSubmissionStatus.PROOF_REQUESTED:
        raise PaymentSubmissionError(
            f"Cannot resubmit from status {submission.status}."
        )

    submission.proof_file = new_proof_file
    submission.status = PaymentSubmissionStatus.SUBMITTED
    submission.save(update_fields=["proof_file", "status", "updated_at"])
    _notify(submission, "payment_submitted")
    return submission


def _mark_related_payment_submitted(submission: PaymentSubmission) -> None:
    """
    Mirror of _unlock_related_object() but for the SUBMITTED transition
    rather than VERIFIED — keeps TrackingRequest.status in sync with
    PaymentSubmission.status without tracking/ having to poll payments/.
    """
    if submission.purpose == PaymentPurpose.TRACKING_FEE:
        from apps.tracking.services import mark_tracking_payment_submitted

        mark_tracking_payment_submitted(tracking_id=submission.related_object_id)
    # INSTITUTION_LICENSE and other purposes don't need a SUBMITTED-stage hook yet.


def _unlock_related_object(submission: PaymentSubmission) -> None:
    """
    Dispatch to whatever the payment was for. Kept as a simple mapping so
    adding a new purpose (e.g. certification, later) is a one-line addition
    here rather than a change to the state machine itself.
    """
    if submission.purpose == PaymentPurpose.TRACKING_FEE:
        from apps.tracking.services import mark_tracking_payment_approved

        mark_tracking_payment_approved(tracking_id=submission.related_object_id)

    elif submission.purpose == PaymentPurpose.INSTITUTION_LICENSE:
        from apps.institutions.services import activate_institution_license

        activate_institution_license(institution_id=submission.related_object_id)

    # NOTE: certification purpose intentionally not handled — feature is
    # silenced for this build. Add an elif branch here when re-enabled.


def _notify(submission: PaymentSubmission, event: str) -> None:
    from notifications.services import notify_user

    notify_user(
        user=submission.user,
        event=event,
        context={
            "submission_id": str(submission.id),
            "purpose": submission.get_purpose_display(),
            "status": submission.status,
        },
    )
