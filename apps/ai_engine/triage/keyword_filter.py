import re

from .base import TriageResult

# Deliberately conservative and bilingual (EN/FR). This is a SAFETY NET,
# not a classifier — false positives (unnecessary escalation) are fine
# and expected; false negatives are not. Keep this list reviewed by the
# team, not just engineering, since it governs the highest-stakes cases.
HARD_ESCALATE_PATTERNS = [
    # imminent danger / violence
    r"\bkill(ing)?\b", r"\bsuicide\b", r"\bself[- ]?harm\b",
    r"\bemergency\b", r"\burgent(ly)?\b.*\bdanger\b",
    r"\btuer\b", r"\bsuicid", r"\bdanger\s+immédiat",
    r"\bmenace(s)?\s+de\s+mort\b", r"\bviolence\b",

    # active/ongoing crime requiring immediate human judgment
    r"\bkidnap", r"\benlèvement\b", r"\bassault(ed)?\b", r"\bagress",

    # legal / dispute escalation
    r"\blawyer\b", r"\bavocat\b", r"\bsue\b|\blawsuit\b", r"\bpoursuite\s+judiciaire\b",

    # payment/financial disputes — never let AI touch money
    r"\brefund\b", r"\bremboursement\b", r"\bpayment\s+failed\b",
    r"\bcharged\s+twice\b", r"\bfraudulent\s+charge\b",

    # complaints about moderators/agents
    r"\bcomplain(t)?\b.*\b(agent|moderator|staff)\b",
    r"\bplainte\b.*\b(agent|modérateur)\b",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in HARD_ESCALATE_PATTERNS]


def check_hard_escalation(message: str) -> TriageResult | None:
    """
    Returns a TriageResult(action="escalate", ...) if the message matches
    a hard-escalate pattern, WITHOUT ever calling the AI provider.
    Returns None if the message passes the filter and Gemini/internal
    triage should proceed normally.
    """
    for pattern in _COMPILED:
        if pattern.search(message):
            return TriageResult(
                action="escalate",
                reply=None,
                reason="Matched hard-escalation keyword filter; routed directly to human agent.",
                confidence=1.0,
            )
    return None
