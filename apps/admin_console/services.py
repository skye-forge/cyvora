from django.db import transaction
from django.utils import timezone

from shared.exceptions.base import InvalidStateTransitionError
from shared.mixins.audit_loggable import log_audit_action
from apps.incidents.models import Incident

VALID_TRANSITIONS = {
    "pending": {"under_review", "rejected"},
    "under_review": {"approved", "rejected"},
    "approved": set(),  # terminal
    "rejected": set(),  # terminal
}


@transaction.atomic
def review_report(
    *,
    actor,
    report: Incident,
    new_status: str,
    rejection_reason: str = "",
    redacted_description: str = "",
    ip_address: str = "",
) -> Incident:
    """
    FR-MOD-02, FR-MOD-05: enforces valid status transitions and logs
    every moderation decision for audit (NFR-12).
    """
    if new_status not in VALID_TRANSITIONS.get(report.status, set()):
        raise InvalidStateTransitionError(
            f"Cannot move report from '{report.status}' to '{new_status}'."
        )

    report.status = new_status
    if new_status == "rejected":
        report.rejection_reason = rejection_reason
    if redacted_description:
        report.description = redacted_description  # FR-MOD-04

    report.resolved_at = (
        timezone.now() if new_status in ("approved", "rejected") else None
    )
    report.save()

    log_audit_action(
        actor,
        f"incident_report.{new_status}",
        report,
        {
            "report_reference": report.report_reference,
            "rejection_reason": rejection_reason,
        },
        ip_address=ip_address,
    )

    if new_status == "approved":
        _publish_community_alert(report)

    return report


def _publish_community_alert(report: Incident):
    """FR-MOD-03: auto-generate a Community Alert, withholding reporter identity by default."""
    from apps.community.models import CommunityPost

    CommunityPost.objects.create(
        type="alert",
        source_report=report,
        author=None,  # system-generated, identity withheld
        content=report.description,
        tags=[f"#{ report.category.name }Alert"],
    )
