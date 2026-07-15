from django.apps import AppConfig


class InstitutionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.institutions"

    def ready(self):
        import apps.institutions.signals  # noqa: F401
