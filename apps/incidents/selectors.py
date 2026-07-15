from shared.exceptions import NotFoundError

from .models import Incident


def list_incidents(*, user, status=None):
    """FR-TRK-01: citizens see only their own reports, filterable by status.
    Staff (institution/system admin) see everything — role-based visibility,
    same pattern as before."""
    qs = Incident.objects.select_related("category", "reporter").all()
    if user.role == "citizen":
        qs = qs.filter(reporter=user)
    if status:
        qs = qs.filter(status=status)
    return qs


def get_incident(incident_id) -> Incident:
    try:
        return Incident.objects.select_related("category", "reporter").get(
            id=incident_id
        )
    except Incident.DoesNotExist:
        raise NotFoundError("Incident not found.")


def get_incident_by_reference(report_reference: str) -> Incident:
    try:
        return Incident.objects.select_related("category", "reporter").get(
            report_reference=report_reference,
        )
    except Incident.DoesNotExist:
        raise NotFoundError("Incident not found.")
