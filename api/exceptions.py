import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from shared.models.base import AppException

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Normalize API error responses to a consistent envelope."""
    if isinstance(exc, AppException):
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
            status=exc.status_code,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled exception in %s", context.get("view"))
        return None

    detail = response.data
    if isinstance(detail, dict):
        if "detail" in detail:
            message = str(detail["detail"])
            details = {key: value for key, value in detail.items() if key != "detail"}
        else:
            message = "Request failed"
            details = detail
    else:
        message = str(detail)
        details = {}

    response.data = {
        "success": False,
        "error": {
            "code": "error",
            "message": message,
        },
    }
    if details:
        response.data["error"]["details"] = details

    return response
