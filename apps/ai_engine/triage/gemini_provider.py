import logging

from ..client import GeminiClient
from ..exceptions import AIParseError, AIServiceError
from ..prompts import SUPPORT_TRIAGE_SYSTEM_PROMPT, SUPPORT_TRIAGE_USER_TEMPLATE
from .base import TriageProvider, TriageResult

logger = logging.getLogger("varnis.ai.triage")

REQUIRED_KEYS = {"action", "confidence"}


class GeminiTriageProvider(TriageProvider):
    """
    Current production triage provider. Wraps Gemini behind the
    TriageProvider interface so support/ code never touches the Gemini
    SDK directly.
    """

    def __init__(self):
        self._client = GeminiClient(system_instruction=SUPPORT_TRIAGE_SYSTEM_PROMPT)

    def triage(
        self,
        message: str,
        history: list[str],
        category: str,
        language: str,
    ) -> TriageResult:
        prompt = SUPPORT_TRIAGE_USER_TEMPLATE.format(
            history="\n".join(history) if history else "(no prior messages)",
            category=category or "general",
            language=language or "en",
            message=message,
        )

        try:
            data = self._client.generate_json(prompt)
        except (AIServiceError, AIParseError) as exc:
            # Infrastructure or parsing failure -> fail safe to human agent.
            logger.warning("Gemini triage failed, escalating by default: %s", exc)
            return TriageResult(
                action="escalate",
                reply=None,
                reason=f"AI triage unavailable ({exc.__class__.__name__}); auto-escalated.",
                confidence=0.0,
            )

        if not REQUIRED_KEYS.issubset(data.keys()):
            logger.warning("Gemini triage response missing keys: %s", data)
            return TriageResult(
                action="escalate",
                reply=None,
                reason="AI response malformed; auto-escalated.",
                confidence=0.0,
            )

        action = data.get("action")
        confidence = float(data.get("confidence") or 0.0)

        if action not in ("answer", "escalate"):
            action = "escalate"

        result = TriageResult(
            action=action,
            reply=data.get("reply"),
            reason=data.get("reason"),
            confidence=confidence,
        )

        # Enforce the confidence floor server-side — never trust the model
        # alone to decide it's safe to answer.
        if result.action == "answer" and result.confidence < 0.6:
            result.action = "escalate"
            result.reason = result.reason or "Low AI confidence; auto-escalated."

        if result.action == "answer" and not result.reply:
            result.action = "escalate"
            result.reason = "AI marked answer but returned no reply text; auto-escalated."

        return result
