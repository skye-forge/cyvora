"""
Auto-classification via the NLP microservice (Rayan's FastAPI service —
see the team project document, section 3.1: NLP MICROSERVICE).
Not wired in yet — integrations/ai/client.py doesn't exist until Sprint 3.

def classify_incident(incident) -> dict:
    from integrations.ai.client import AIServiceClient
    result = AIServiceClient.classify(text=incident.description)
    incident.severity = result["severity"]
    incident.save(update_fields=["severity"])
    return result
"""
