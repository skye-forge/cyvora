import logging

from .base import TriageResult
from .factory import get_triage_provider
from .keyword_filter import check_hard_escalation

logger = logging.getLogger("varnis.ai.triage")


def run_triage(message: str, history: list[str], category: str, language: str) -> TriageResult:
    """
    The single function apps.support should call for AI triage.

    Order of operations:
      1. Keyword pre-filter (no AI call, cheap, catches highest-stakes cases)
      2. AI provider (Gemini today, internal ML service later)
      3. Server-side confidence floor is enforced inside the provider itself

    Never raises for content reasons — infrastructure failures are caught
    inside the provider and converted into an "escalate" result, so a
    citizen is always routed to a human if anything goes wrong rather
    than getting silence or an error.
    """
    hard_hit = check_hard_escalation(message)
    if hard_hit is not None:
        logger.info("Hard-escalation keyword filter triggered")
        return hard_hit

    provider = get_triage_provider()
    result: TriageResult = provider.triage(
        message=message,
        history=history,
        category=category,
        language=language,
    )

    logger.info(
        "Triage decision: action=%s confidence=%.2f",
        result.action,
        result.confidence,
    )

    return result
