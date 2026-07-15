from rest_framework.versioning import URLPathVersioning as BaseURLPathVersioning


class URLPathVersioning(BaseURLPathVersioning):
    """Kept as a thin subclass so version behaviour can be customised later
    (e.g. deprecation headers) without touching DRF settings elsewhere."""
    invalid_version_message = "Unsupported API version."
