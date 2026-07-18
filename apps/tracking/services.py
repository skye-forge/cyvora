"""
Service layer for tracking. All status transitions go through
transition_status(), which checks ALLOWED_TRANSITIONS and writes a
TimelineEvent — so the timeline can never drift out of sync with the
actual status field. Nothing outside this module should set
TrackingRequest.status directly.
"""

from django.utils import timezone
from django.db import transaction

from .models import (
    TrackingRequest,
    TrackingStatus,
    ALLOWED_TRANSITIONS,
    ElectronicDevice,
    Vehicle,
    OwnershipVerification,
    AuthorityCase,
    AuthorityCaseStatus,
    Evidence,
    EvidenceRequest,
    EvidenceRequestStatus,
    TimelineEvent,
)


class TrackingError(Exception):
    pass


# ── Core lifecycle ──────────────────────────────────────────────────────


@transaction.atomic
def create_tracking_request(
    *, user, category, description="", device_data=None, vehicle_data=None
):
    from kyc.services import is_user_verified

    if not is_user_verified(user):
        raise TrackingError(
            "User must have an approved KYC record before filing a tracking request."
        )

    tracking_request = TrackingRequest.objects.create(
        user=user,
        category=category,
        description=description,
    )

    if category == "ELECTRONIC_DEVICE":
        if not device_data:
            raise TrackingError(
                "device_data is required for category ELECTRONIC_DEVICE."
            )
        ElectronicDevice.objects.create(
            tracking_request=tracking_request, **device_data
        )
    elif category == "VEHICLE":
        if not vehicle_data:
            raise TrackingError("vehicle_data is required for category VEHICLE.")
        Vehicle.objects.create(tracking_request=tracking_request, **vehicle_data)

    record_timeline_event(
        tracking_request,
        event_type="CREATED",
        description="Tracking request created.",
        actor=user,
    )
    return tracking_request


def transition_status(
    *,
    tracking_request: TrackingRequest,
    new_status: str,
    actor=None,
    description: str = "",
) -> TrackingRequest:
    current = tracking_request.status
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise TrackingError(
            f"Cannot move from {current} to {new_status}. Allowed: {sorted(allowed)}"
        )

    tracking_request.status = new_status
    if new_status in (TrackingStatus.CLOSED, TrackingStatus.CANCELLED):
        tracking_request.closed_at = timezone.now()
        tracking_request.save(update_fields=["status", "closed_at", "updated_at"])
    else:
        tracking_request.save(update_fields=["status", "updated_at"])

    record_timeline_event(
        tracking_request,
        event_type=new_status,
        description=description or f"Status changed to {new_status}.",
        actor=actor,
    )
    _notify(tracking_request, "tracking_status_changed", extra={"status": new_status})
    return tracking_request


# ── Ownership verification ──────────────────────────────────────────────


@transaction.atomic
def submit_ownership_verification(
    *,
    tracking_request: TrackingRequest,
    admin_user,
    matched_account_name: bool,
    matched_phone: bool,
    matched_password: bool,
    friend_account_used: bool = False,
    notes: str = "",
) -> OwnershipVerification:
    if tracking_request.status != TrackingStatus.DRAFT:
        raise TrackingError(
            "Ownership verification can only be recorded while status is DRAFT."
        )

    verification, _ = OwnershipVerification.objects.update_or_create(
        tracking_request=tracking_request,
        defaults=dict(
            matched_account_name=matched_account_name,
            matched_phone=matched_phone,
            matched_password=matched_password,
            friend_account_used=friend_account_used,
            verified_by=admin_user,
            verified_at=timezone.now(),
            notes=notes,
        ),
    )

    if verification.passes:
        transition_status(
            tracking_request=tracking_request,
            new_status=TrackingStatus.OWNERSHIP_VERIFIED,
            actor=admin_user,
            description=f"Ownership verified ({verification.score}/3).",
        )
    else:
        record_timeline_event(
            tracking_request,
            event_type="OWNERSHIP_VERIFICATION_FAILED",
            description=f"Ownership verification scored {verification.score}/3 — below threshold.",
            actor=admin_user,
        )

    return verification


# ── Payment integration (called from payments.services._unlock_related_object) ──


def request_payment(
    *, tracking_request: TrackingRequest, actor=None
) -> TrackingRequest:
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.PAYMENT_PENDING,
        actor=actor,
        description="Awaiting tracking fee payment.",
    )


def mark_tracking_payment_submitted(*, tracking_id, actor=None) -> TrackingRequest:
    tracking_request = TrackingRequest.objects.get(id=tracking_id)
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.PAYMENT_SUBMITTED,
        actor=actor,
        description="Payment proof submitted, awaiting verification.",
    )


def mark_tracking_payment_approved(*, tracking_id, actor=None) -> TrackingRequest:
    """
    Called by payments.services.approve_submission() via the purpose
    dispatch table. Do not rename without updating that reference.
    """
    tracking_request = TrackingRequest.objects.get(id=tracking_id)
    tracking_request = transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.PAYMENT_APPROVED,
        actor=actor,
        description="Tracking fee payment verified.",
    )
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.QUEUED,
        actor=actor,
        description="Queued for authority assignment.",
    )


# ── Authority workflow ───────────────────────────────────────────────────


@transaction.atomic
def assign_to_authority(
    *,
    tracking_request: TrackingRequest,
    actor,
    agency,
    institution_name="",
    institution_id=None,
    assigned_officer="",
    case_number="",
    expected_completion=None,
) -> AuthorityCase:
    if tracking_request.status != TrackingStatus.QUEUED:
        raise TrackingError("Can only assign to authority while status is QUEUED.")

    case = AuthorityCase.objects.create(
        tracking_request=tracking_request,
        agency=agency,
        institution_name=institution_name,
        institution_id=institution_id,
        assigned_officer=assigned_officer,
        case_number=case_number,
        assigned_date=timezone.now().date(),
        expected_completion=expected_completion,
    )
    transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.SENT_TO_AUTHORITY,
        actor=actor,
        description=f"Assigned to {case.get_agency_display()}.",
    )
    return case


def mark_under_investigation(*, tracking_request, actor, remarks="") -> TrackingRequest:
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.UNDER_INVESTIGATION,
        actor=actor,
        description=remarks or "Investigation started.",
    )


def mark_located(*, tracking_request, actor, remarks="") -> TrackingRequest:
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.LOCATED,
        actor=actor,
        description=remarks or "Item located.",
    )


def mark_recovered(*, tracking_request, actor, remarks="") -> TrackingRequest:
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.RECOVERED,
        actor=actor,
        description=remarks or "Item recovered.",
    )


def close_case(*, tracking_request, actor, remarks="") -> TrackingRequest:
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.CLOSED,
        actor=actor,
        description=remarks or "Case closed.",
    )


def cancel_request(*, tracking_request, actor, remarks="") -> TrackingRequest:
    return transition_status(
        tracking_request=tracking_request,
        new_status=TrackingStatus.CANCELLED,
        actor=actor,
        description=remarks or "Cancelled by citizen or admin.",
    )


# ── Evidence loop ────────────────────────────────────────────────────────


def add_evidence(*, tracking_request, uploaded_by, file, description="") -> Evidence:
    evidence = Evidence.objects.create(
        tracking_request=tracking_request,
        uploaded_by=uploaded_by,
        file=file,
        description=description,
    )
    record_timeline_event(
        tracking_request,
        event_type="EVIDENCE_UPLOADED",
        description=description or "Evidence uploaded.",
        actor=uploaded_by,
    )
    return evidence


def create_evidence_request(
    *, tracking_request, requested_by, message
) -> EvidenceRequest:
    req = EvidenceRequest.objects.create(
        tracking_request=tracking_request,
        requested_by=requested_by,
        message=message,
    )
    record_timeline_event(
        tracking_request,
        event_type="EVIDENCE_REQUESTED",
        description="Authorities requested additional documents.",
        actor=requested_by,
    )
    _notify(tracking_request, "tracking_evidence_requested", extra={"message": message})
    return req


def fulfill_evidence_request(
    *, evidence_request: EvidenceRequest, evidence: Evidence
) -> EvidenceRequest:
    if evidence_request.status != EvidenceRequestStatus.OPEN:
        raise TrackingError("Evidence request is not open.")
    evidence_request.status = EvidenceRequestStatus.FULFILLED
    evidence_request.fulfilled_by_evidence = evidence
    evidence_request.fulfilled_at = timezone.now()
    evidence_request.save(
        update_fields=["status", "fulfilled_by_evidence", "fulfilled_at"]
    )
    record_timeline_event(
        evidence_request.tracking_request,
        event_type="EVIDENCE_REQUEST_FULFILLED",
        description="Requested documents provided.",
        actor=evidence.uploaded_by,
    )
    return evidence_request


# ── Timeline ─────────────────────────────────────────────────────────────


def record_timeline_event(
    tracking_request: TrackingRequest, *, event_type: str, description: str, actor=None
) -> TimelineEvent:
    return TimelineEvent.objects.create(
        tracking_request=tracking_request,
        event_type=event_type,
        description=description,
        created_by=actor,
    )


def _notify(tracking_request: TrackingRequest, event: str, extra: dict = None) -> None:
    from notifications.services import notify_user

    context = {
        "tracking_id": str(tracking_request.id),
        "reference_code": tracking_request.reference_code,
    }
    context.update(extra or {})
    notify_user(user=tracking_request.user, event=event, context=context)
