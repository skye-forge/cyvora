# Simple blocklist screening for text content. Swap this out for a real
# moderation API (e.g. OpenAI Moderation, Perspective API) later — the
# function signature is the contract community/tasks.py depends on.

BLOCKED_TERMS = [
    "kill",
    "bomb",
    "terrorist",
    "rape",
    # extend with hate-speech / harassment / scam-solicitation terms as needed
]


def screen_text(text: str) -> tuple[bool, list[str]]:
    """
    Returns (is_flagged, matched_terms).
    Case-insensitive substring match — deliberately crude; the point is
    to catch the obvious cases automatically and escalate anything
    ambiguous to a human, not to be a complete moderation system on its own.
    """
    lowered = text.lower()
    matched = [term for term in BLOCKED_TERMS if term in lowered]
    return (len(matched) > 0, matched)
