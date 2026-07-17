class ServiceError(Exception):
    """
    Base exception raised from the service layer. Views/mixins catch
    this and translate it into the standard error_response envelope.
    This is the ONLY exception hierarchy in the codebase — do not add
    a second one (see shared/exceptions/base.py removal note).
    """

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


class InvalidStateTransitionError(ServiceError):
    default_message = "This action is not valid for the current state."
    status_code = 409


__all__ = [
    "ServiceError",
    "NotFoundError",
    "PermissionDeniedError",
    "ValidationFailedError",
    "AuthenticationFailedError",
    "InvalidStateTransitionError",
]
