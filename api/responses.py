"""
Standard response envelope used across every endpoint so that
Flutter / React clients can rely on one consistent shape.
"""
from rest_framework.response import Response


def success_response(data=None, message="", status=200, meta=None):
    payload = {"success": True, "message": message, "data": data}
    if meta is not None:
        payload["meta"] = meta
    return Response(payload, status=status)


def error_response(message="", errors=None, status=400):
    return Response(
        {"success": False, "message": message, "errors": errors},
        status=status,
    )
