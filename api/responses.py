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
