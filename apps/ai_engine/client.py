import json
import logging

import google.generativeai as genai
from django.conf import settings

from .exceptions import AIConfigError, AIParseError, AIServiceError

logger = logging.getLogger("varnis.ai")


class GeminiClient:
    """
    Central Gemini API client for VARNIS AI features.

    Used by:
      - incident classification (apps.ai_engine.services.analyze_incident)
      - support chat triage (apps.ai_engine.triage.gemini_provider)

    Kept as a single client so API-key handling, model selection, and
    error handling live in exactly one place.
    """

    DEFAULT_MODEL = "gemini-2.5-flash"

    def __init__(self, model_name: str | None = None, system_instruction: str | None = None):
        if not getattr(settings, "GEMINI_API_KEY", None):
            raise AIConfigError("GEMINI_API_KEY is missing from settings/.env")

        genai.configure(api_key=settings.GEMINI_API_KEY)

        self.model = genai.GenerativeModel(
            model_name or self.DEFAULT_MODEL,
            system_instruction=system_instruction,
        )

    def generate(self, prompt: str) -> str:
        """
        Original behaviour, preserved for backward compatibility with
        existing incident-classification code. Returns raw text.
        """
        try:
            response = self.model.generate_content(prompt)
        except Exception as exc:  # noqa: BLE001 - broad on purpose, this is a network/SDK boundary
            logger.exception("Gemini generate() call failed")
            raise AIServiceError(f"Gemini request failed: {exc}") from exc

        return response.text

    def generate_json(self, prompt: str, temperature: float = 0.3) -> dict:
        """
        Requests a JSON-mode response from Gemini and parses it.
        Use this for anything that must be machine-readable (triage
        decisions, classification results, etc).
        """
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    response_mime_type="application/json",
                ),
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Gemini generate_json() call failed")
            raise AIServiceError(f"Gemini request failed: {exc}") from exc

        raw_text = response.text

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as exc:
            logger.warning("Gemini returned non-JSON output: %s", raw_text[:500])
            raise AIParseError(f"Could not parse Gemini JSON response: {exc}") from exc
