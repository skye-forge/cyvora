import logging

import requests
from django.conf import settings

from ..exceptions import AIServiceError
from .base import TriageProvider, TriageResult

logger = logging.getLogger("varnis.ai.triage")


class InternalTriageProvider(TriageProvider):
    """
    Placeholder for the ML team's own triage/predict service.

    NOT YET WIRED UP. Once the ML team confirms the contract for their
    support-triage endpoint (separate from the incident-classification
    /predict), fill in INTERNAL_TRIAGE_URL in settings and this class
    will work without any other code in the project changing — flip
    AI_TRIAGE_PROVIDER = "internal" in settings/.env.

    Expected contract (confirm with ML team before enabling):

        POST {INTERNAL_TRIAGE_URL}
        {
          "message": "...",
          "history": ["citizen: ...", "ai: ...", ...],
          "category": "technical",
          "language": "en"
        }

        200 OK
        {
          "action": "answer" | "escalate",
          "reply": "string | null",
          "reason": "string | null",
          "confidence": 0.0
        }
    """

    def __init__(self):
        self.url = getattr(settings, "INTERNAL_TRIAGE_URL", None)
        self.timeout = getattr(settings, "INTERNAL_TRIAGE_TIMEOUT", 8)
        if not self.url:
            raise AIServiceError(
                "INTERNAL_TRIAGE_URL is not configured. "
                "Set AI_TRIAGE_PROVIDER back to 'gemini' until the ML team's "
                "triage endpoint is ready."
            )

    def triage(
        self,
        message: str,
        history: list[str],
        category: str,
        language: str,
    ) -> TriageResult:
        payload = {
            "message": message,
            "history": history,
            "category": category,
            "language": language,
        }

        try:
            response = requests.post(self.url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Internal triage service failed, escalating by default: %s", exc)
            return TriageResult(
                action="escalate",
                reply=None,
                reason=f"Internal triage service unavailable ({exc.__class__.__name__}); auto-escalated.",
                confidence=0.0,
            )

        return TriageResult(
            action=data.get("action", "escalate"),
            reply=data.get("reply"),
            reason=data.get("reason"),
            confidence=float(data.get("confidence") or 0.0),
        )
