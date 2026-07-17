from apps.incidents.models import Incident
from shared.utils import generate_short_reference


def submit_incident(*, user, validated_data: dict) -> Incident:
    """FR-INC-07: assign an initial status of Pending and generate a
    unique report reference (e.g. #CV-9921) on submission."""
    is_anonymous = validated_data.get("is_anonymous", False)

    incident = Incident.objects.create(
        reporter=None if is_anonymous else user,
        report_reference=generate_short_reference("CV", Incident, "report_reference"),
        **validated_data,
    )
    return incident


