class ServiceError(Exception):
    """Base exception raised from the service layer.
    Views catch this and translate it into a standard error_response."""

    default_message = "Something went wrong."
    status_code = 400

    def __init__(self, message=None, status_code=None):
        self.message = message or self.default_message
        self.status_code = status_code or self.status_code
        super().__init__(self.message)


class NotFoundError(ServiceError):
    default_message = "Resource not found."
    status_code = 404


class PermissionDeniedError(ServiceError):
    default_message = "You do not have permission to perform this action."
    status_code = 403


class ValidationFailedError(ServiceError):
    default_message = "Validation failed."
    status_code = 422


class AuthenticationFailedError(ServiceError):
    default_message = "Invalid credentials."
    status_code = 401


__all__ = [
    "ServiceError",
    "NotFoundError",
    "PermissionDeniedError",
    "ValidationFailedError",
    "AuthenticationFailedError",
]
