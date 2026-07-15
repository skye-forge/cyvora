class AppException(Exception):
    """Base for all custom app exceptions. Carries an HTTP-friendly shape."""

    status_code = 400
    default_code = "error"
    default_message = "Something went wrong."

    def __init__(self, message: str | None = None, code: str | None = None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        super().__init__(self.message)


class NotFoundError(AppException):
    status_code = 404
    default_code = "not_found"
    default_message = "Resource not found."


class PermissionDeniedError(AppException):
    status_code = 403
    default_code = "permission_denied"
    default_message = "You do not have permission to perform this action."


class InvalidStateTransitionError(AppException):
    status_code = 409
    default_code = "invalid_state_transition"
    default_message = "This action is not valid for the current state."
