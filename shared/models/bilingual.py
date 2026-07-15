from django.db import models


class BilingualContentMixin(models.Model):
    """
    Mixin for any model that needs parallel EN/FR text fields
    (LegalArticle, LessonPart, NationalUpdate, etc).
    """

    class Meta:
        abstract = True

    def get_localized(self, field: str, lang: str) -> str:
        """
        Usage: article.get_localized("title", "fr") -> article.title_fr
        Falls back to English if the requested language field is empty.
        """
        lang = lang if lang in ("en", "fr") else "en"
        value = getattr(self, f"{field}_{lang}", "")
        if not value and lang != "en":
            value = getattr(self, f"{field}_en", "")
        return value
