from .models import Incident
from apps.ai_engine.services import analyze_incident

# def submit_incident(*, user, validated_data: dict) -> Incident:
#     is_anonymous = validated_data.get("is_anonymous", False)
#     incident = Incident.objects.create(
#         reporter=None if is_anonymous else user,
#         **validated_data,
#     )
#     # Sprint 3: dispatch to the NLP microservice here for auto-classification
#     # (integrations/ai/client.py) once Rayan's FastAPI service is deployed.
#     return incident


def create_incident(user, data):

    incident = Incident.objects.create(
        user=user, description=data["description"], location=data.get("location")
    )

    ai_result = analyze_incident(incident.description)

    incident.ai_category = ai_result.get("category")

    incident.ai_severity = ai_result.get("severity")

    incident.ai_risk_score = ai_result.get("risk_score")

    incident.ai_summary = ai_result.get("summary")

    incident.save()

    return incident
