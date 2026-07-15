import pytest
from rest_framework.test import APIClient

from apps.accounts.tests.factories import UserFactory
from apps.incidents.models import IncidentCategory

pytestmark = pytest.mark.django_db


@pytest.fixture
def authed_client():
    client = APIClient()
    user = UserFactory(email="reporter@varnis.cm", password="TestPass123")
    client.force_authenticate(user=user)
    return client, user


def test_authenticated_user_can_create_and_list_incidents(authed_client):
    client, user = authed_client
    category = IncidentCategory.objects.create(name="MoMo Fraud")

    response = client.post(
        "/api/v1/incidents/",
        {
            "title": "Unauthorized MoMo transfer",
            "description": "Received a phishing SMS and lost funds.",
            "category_id": category.id,
            "region": "Centre",
            "platform": "MTN MoMo",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["title"] == "Unauthorized MoMo transfer"
    assert data["category"]["name"] == "MoMo Fraud"
    assert data["reporter"] == user.id

    list_response = client.get("/api/v1/incidents/")
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1


def test_anonymous_report_does_not_store_reporter(authed_client):
    client, _ = authed_client
    category = IncidentCategory.objects.create(name="Phishing")

    response = client.post(
        "/api/v1/incidents/",
        {
            "title": "Phishing email",
            "description": "Fake bank email asking for OTP.",
            "category_id": category.id,
            "is_anonymous": True,
        },
    )

    assert response.status_code == 201
    assert response.json()["data"]["reporter"] is None


def test_citizen_cannot_see_other_users_incidents(authed_client):
    client, _ = authed_client
    other_user = UserFactory(email="someone_else@varnis.cm", password="TestPass123")
    category = IncidentCategory.objects.create(name="Malware")
    from apps.incidents.models import Incident

    Incident.objects.create(
        title="Not mine", description="...", category=category, reporter=other_user
    )

    response = client.get("/api/v1/incidents/")

    assert response.status_code == 200
    assert response.json()["data"] == []
