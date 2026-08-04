"""
Auto-classification via the NLP microservice (Rayan's FastAPI service —
team project document, section 3.1: NLP MICROSERVICE). Not wired in
until integrations/ai_engine/client.py exists (Sprint 3).
"""

from shared.exceptions import ServiceError


def classify_incident(incident):
    """
    Sprint 3: replace this stub with the real call:
        from integrations.ai.client import AIServiceClient
        result = AIServiceClient.classify(text=incident.description)
        incident.severity = result["severity"]
        incident.save(update_fields=["severity"])
        return result
    """
    raise ServiceError(
        "Incident auto-classification is not yet available.", status_code=501
    )
