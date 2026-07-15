class TimestampedMixin:
    """Reminder mixin: model classes should inherit from
    core.models.TimeStampedModel (created_at/updated_at) rather than
    redefining these fields per app. Placeholder kept here for
    service/view mixins that are not model-specific."""


class ServiceExceptionHandlingMixin:
    """
    Mixin for APIViews: wraps dispatch so ServiceError subclasses raised
    inside a view's service-layer calls are converted into the standard
    error envelope, instead of bubbling up as unhandled 500s.
    """

    def handle_exception(self, exc):
        from shared.exceptions import ServiceError
        from api.responses import error_response

        if isinstance(exc, ServiceError):
            return error_response(message=exc.message, status=exc.status_code)
        return super().handle_exception(exc)


__all__ = [
    "TimestampedMixin",
    "ServiceExceptionHandlingMixin",
]
