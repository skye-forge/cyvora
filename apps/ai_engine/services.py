import json
import logging

from .client import GeminiClient
from .exceptions import AIServiceError
from .prompts import INCIDENT_CLASSIFICATION_PROMPT

logger = logging.getLogger("varnis.ai")


def analyze_incident(description: str) -> dict:
    """
    Existing incident-classification entry point. Unchanged behaviour —
    callers (apps.incidents) do not need to change anything.
    """
    prompt = INCIDENT_CLASSIFICATION_PROMPT.format(description=description)

    client = GeminiClient()

    try:
        result = client.generate(prompt)
    except AIServiceError:
        logger.exception("Incident classification failed")
        raise

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"raw_response": result}
