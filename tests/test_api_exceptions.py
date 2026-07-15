from rest_framework.response import Response

from api.exceptions import custom_exception_handler
from shared.exceptions.base import AppException


class DummyView:
    pass


def test_custom_exception_handler_formats_app_exception():
    exc = AppException(message="Something went wrong", code="custom_error")
    response = custom_exception_handler(exc, {"view": DummyView()})

    assert isinstance(response, Response)
    assert response.status_code == 400
    assert response.data["success"] is False
    assert response.data["error"]["code"] == "custom_error"
    assert response.data["error"]["message"] == "Something went wrong"
