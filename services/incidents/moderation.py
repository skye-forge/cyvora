"""FR-MOD-01..05: moderator status transitions, auditability, and
auto-generating a Community Alert on approval."""

from apps.incidents.models import Incident, ModerationLog
from shared.exceptions import InvalidStateTransitionError

VALID_TRANSITIONS = {
    Incident.STATUS_PENDING: {
        Incident.STATUS_UNDER_REVIEW,
        Incident.STATUS_APPROVED,
        Incident.STATUS_REJECTED,
    },
    Incident.STATUS_UNDER_REVIEW: {Incident.STATUS_APPROVED, Incident.STATUS_REJECTED},
    Incident.STATUS_APPROVED: set(),
    Incident.STATUS_REJECTED: set(),
}


def moderate_incident(
    *,
    moderator,
    incident,
    new_status,
    reason= "",
    alert_content: str = None,
):
    if new_status not in VALID_TRANSITIONS.get(incident.status, set()):
        raise InvalidStateTransitionError(
            f"Cannot transition from '{incident.status}' to '{new_status}'."
        )

    old_status = incident.status

    if new_status == Incident.STATUS_UNDER_REVIEW:
        incident.move_to_under_review()
    elif new_status == Incident.STATUS_APPROVED:
        incident.approve()
        _publish_alert(incident, alert_content)
    elif new_status == Incident.STATUS_REJECTED:
        incident.reject(reason=reason)

    ModerationLog.objects.create(
        incident=incident,
        moderator=moderator,
        from_status=old_status,
        to_status=new_status,
        reason=reason,
    )
    return incident


def _publish_alert(incident: Incident, alert_content: str = None) -> None:
    from services.community.alerts import generate_alert_from_incident

    generate_alert_from_incident(incident, custom_content=alert_content)
