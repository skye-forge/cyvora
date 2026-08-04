class AIServiceError(Exception):
    """Raised when the underlying AI provider (Gemini, internal ML service, etc.)
    fails to respond, times out, or returns an unusable result."""
    pass


class AIParseError(AIServiceError):
    """Raised when the AI provider responds successfully but the response
    cannot be parsed into the expected structured format (e.g. malformed JSON)."""
    pass


class AIConfigError(AIServiceError):
    """Raised when required AI configuration (API keys, provider settings) is
    missing or invalid."""
    pass
