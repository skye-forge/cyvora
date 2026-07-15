"""
FR-COM-04: automated keyword screening for Tips, with escalation to a
human moderator when flagged.

This is a placeholder heuristic — swap for a real moderation service
(e.g. a hosted content-moderation API) before production. Keeping it as
a simple keyword list makes the escalation *path* correct (flagged
content stays in `pending` for a moderator, clean content auto-publishes)
without depending on an external service that doesn't exist yet.
"""

import re

FLAGGED_PATTERNS = [
    r"\bwire\s+transfer\s+immediately\b",
    r"\bclick\s+here\s+to\s+claim\b",
    r"\bguaranteed\s+winner\b",
    r"\bsend\s+your\s+pin\b",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in FLAGGED_PATTERNS]


def needs_human_review(content: str) -> bool:
    return any(pattern.search(content) for pattern in _COMPILED)
