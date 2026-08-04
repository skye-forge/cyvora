from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TriageResult:
    """
    Normalized result returned by ANY triage provider (Gemini today,
    the internal ML team's /predict endpoint tomorrow). Nothing outside
    this module should ever see a provider-specific response shape.
    """

    action: str            # "answer" or "escalate"
    reply: str | None       # citizen-facing text, required when action == "answer"
    reason: str | None      # internal note for the agent, required when action == "escalate"
    confidence: float       # 0.0 - 1.0

    def is_escalation(self) -> bool:
        return self.action == "escalate" or self.confidence < 0.6


class TriageProvider(ABC):
    """
    Interface every AI triage backend must implement.

    Swapping providers (Gemini -> internal ML service) is a one-line
    settings change (AI_TRIAGE_PROVIDER) — nothing in apps.support should
    ever import a concrete provider directly.
    """

    @abstractmethod
    def triage(
        self,
        message: str,
        history: list[str],
        category: str,
        language: str,
    ) -> TriageResult:
        """
        message  - the citizen's latest message text
        history  - prior messages in the ticket, oldest first, formatted
                   as "sender_role: text" strings
        category - the ticket's category (e.g. "technical", "report_help")
        language - "en" or "fr", the citizen's preferred language

        Must never raise on a *content* problem (e.g. ambiguous message) —
        return TriageResult(action="escalate", ...) instead. It MAY raise
        AIServiceError subclasses on infrastructure failure (network,
        auth, malformed provider response); callers are expected to catch
        those and escalate as a fallback.
        """
        raise NotImplementedError
