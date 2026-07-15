from apps.incidents.models import Incident
from shared.helpers import generate_unique_code


def submit_incident(*, user, validated_data: dict) -> Incident:
    """FR-INC-07: assign an initial status of Pending and generate a
    unique report reference (e.g. #CV-9921) on submission."""
    is_anonymous = validated_data.get("is_anonymous", False)

    report_reference = _generate_report_reference()
    incident = Incident.objects.create(
        reporter=None if is_anonymous else user,
        report_reference=report_reference,
        **validated_data,
    )
    # Sprint 3: dispatch to classify_incident() below once Rayan's
    # NLP microservice (integrations/ai/client.py) is deployed.
    return incident


def _generate_report_reference() -> str:
    while True:
        candidate = generate_unique_code(prefix="CV-")[:10]
        if not Incident.objects.filter(report_reference=candidate).exists():
            return candidate
