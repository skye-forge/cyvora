from .models import Incident


def submit_incident(*, user, validated_data: dict) -> Incident:
    is_anonymous = validated_data.get("is_anonymous", False)
    incident = Incident.objects.create(
        reporter=None if is_anonymous else user,
        **validated_data,
    )
    # Sprint 3: dispatch to the NLP microservice here for auto-classification
    # (integrations/ai/client.py) once Rayan's FastAPI service is deployed.
    return incident
