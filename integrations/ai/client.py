import google.generativeai as genai

from django.conf import settings


class GeminiClient:
    """
    Central Gemini API client for VARNIS AI features.
    """

    def __init__(self):

        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is missing")

        genai.configure(api_key=settings.GEMINI_API_KEY)

        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate(self, prompt: str):

        response = self.model.generate_content(prompt)

        return response.text
