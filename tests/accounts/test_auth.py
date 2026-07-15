import pytest
from rest_framework.test import APIClient

from tests.accounts.factories import UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


def test_register_creates_user_and_returns_tokens(api_client):
    payload = {
        "name": "Ngono Sarah",
        "email": "sarah@varnis.cm",
        "phone": "+237670000001",
        "language": "fr",
        "password": "StrongPass123",
    }
    response = api_client.post("/api/v1/auth/register", payload, format="json")

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["user"]["email"] == "sarah@varnis.cm"
    assert "access" in body["data"]["tokens"]
    assert "refresh" in body["data"]["tokens"]


def test_register_rejects_duplicate_email(api_client):
    UserFactory(email="dupe@varnis.cm")
    payload = {
        "name": "Someone Else",
        "email": "dupe@varnis.cm",
        "password": "StrongPass123",
    }
    response = api_client.post("/api/v1/auth/register", payload, format="json")

    assert response.status_code in (400, 422)
    assert response.json()["success"] is False


def test_login_with_valid_credentials_returns_tokens(api_client):
    UserFactory(email="login@varnis.cm", password="StrongPass123")
    response = api_client.post(
        "/api/v1/auth/login",
        {"email": "login@varnis.cm", "password": "StrongPass123"},
        format="json",
    )

    assert response.status_code == 200
    assert "access" in response.json()["data"]["tokens"]


def test_login_with_wrong_password_fails(api_client):
    UserFactory(email="login2@varnis.cm", password="StrongPass123")
    response = api_client.post(
        "/api/v1/auth/login",
        {"email": "login2@varnis.cm", "password": "WrongPassword"},
        format="json",
    )

    assert response.status_code == 401
    assert response.json()["success"] is False


def test_me_endpoint_requires_authentication(api_client):
    response = api_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_endpoint_returns_current_user(api_client):
    user = UserFactory(email="me@varnis.cm", password="StrongPass123")
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["data"]["email"] == "me@varnis.cm"
