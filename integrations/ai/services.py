import json

from .client import GeminiClient
from .prompts import INCIDENT_CLASSIFICATION_PROMPT


def analyze_incident(description: str):

    prompt = INCIDENT_CLASSIFICATION_PROMPT.format(description=description)

    client = GeminiClient()

    result = client.generate(prompt)

    try:

        return json.loads(result)

    except json.JSONDecodeError:

        return {"raw_response": result}
