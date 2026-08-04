from django.conf import settings

from .base import TriageProvider
from .gemini_provider import GeminiTriageProvider
from .internal_provider import InternalTriageProvider

_PROVIDERS = {
    "gemini": GeminiTriageProvider,
    "internal": InternalTriageProvider,
}


def get_triage_provider() -> TriageProvider:
    """
    Single switch point for which AI backend handles support triage.

    settings.py / .env:
        AI_TRIAGE_PROVIDER = "gemini"    # current default
        AI_TRIAGE_PROVIDER = "internal"  # once ML team's endpoint is live

    This is the ONLY place in the codebase that should import a concrete
    provider class. Everything else (support/tasks.py) calls this factory.
    """
    provider_name = getattr(settings, "AI_TRIAGE_PROVIDER", "gemini")

    provider_cls = _PROVIDERS.get(provider_name)
    if provider_cls is None:
        raise ValueError(
            f"Unknown AI_TRIAGE_PROVIDER '{provider_name}'. "
            f"Valid options: {list(_PROVIDERS.keys())}"
        )

    return provider_cls()
