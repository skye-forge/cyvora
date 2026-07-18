"""
Standard response envelope used across every endpoint so that
Flutter / React clients can rely on one consistent shape.
"""
from rest_framework.response import Response
from rest_framework import status as http_status


def success_response(
    *, data=None, message: str = "", status_code: int = http_status.HTTP_200_OK
) -> Response:
    payload = {"success": True, "data": data}
    if message:
        payload["message"] = message
    return Response(payload, status=status_code)


def error_response(
    *, message: str, status: int = http_status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Signature matches shared.mixins.ServiceExceptionHandlingMixin's call:
    error_response(message=exc.message, status=exc.status_code).
    """
    return Response({"success": False, "message": message}, status=status)

#
# Standard response envelope for every endpoint in the project:
# {"success": bool, "message": str, "data": ..., "meta": {...}}
# Import as: from api.responses import api_response


def api_response(
    *,
    success: bool,
    message: str = "",
    data=None,
    meta: dict = None,
    status_code: int = None
) -> Response:
    """
    Every view in payments/, kyc/, tracking/ (and anything built after)
    should return through this helper rather than raw Response(), so the
    envelope shape never drifts between apps.
    """
    if status_code is None:
        status_code = (
            http_status.HTTP_200_OK if success else http_status.HTTP_400_BAD_REQUEST
        )

    payload = {
        "success": success,
        "message": message,
        "data": data,
        "meta": meta or {},
    }
    return Response(payload, status=status_code)
