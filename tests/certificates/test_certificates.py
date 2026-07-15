import pytest
from rest_framework.test import APIClient

from tests.accounts.factories import UserFactory
from apps.incidents.models import Incident, IncidentCategory
from apps.learning.models import LearningZone, Lesson, LessonProgress

pytestmark = pytest.mark.django_db


@pytest.fixture
def authed_client():
    client = APIClient()
    user = UserFactory(email="cert@varnis.cm", password="TestPass123")
    client.force_authenticate(user=user)
    return client, user


def test_bronze_certificate_requires_one_completed_lesson(authed_client):
    client, user = authed_client

    response = client.post("/api/v1/certificates/issue", {"tier": "bronze"})
    assert response.status_code == 422  # not eligible yet

    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    lesson = Lesson.objects.create(title="Intro", content="...", zone=zone)
    LessonProgress.objects.create(user=user, lesson=lesson, completed=True)

    response = client.post("/api/v1/certificates/issue", {"tier": "bronze"})
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["tier"] == "bronze"
    assert data["cert_code"].startswith("DC-")
    assert data["pdf_url"] is not None
    assert data["qr_url"] is not None
    assert data["is_valid"] is True


def test_gold_certificate_requires_all_zones_and_an_incident_report(authed_client):
    client, user = authed_client
    zone1 = LearningZone.objects.create(name="Zone 1", zone_number=1)
    zone2 = LearningZone.objects.create(name="Zone 2", zone_number=2)
    lesson1 = Lesson.objects.create(title="L1", content="...", zone=zone1)
    lesson2 = Lesson.objects.create(title="L2", content="...", zone=zone2)
    LessonProgress.objects.create(user=user, lesson=lesson1, completed=True)

    response = client.post("/api/v1/certificates/issue", {"tier": "gold"})
    assert response.status_code == 422

    LessonProgress.objects.create(user=user, lesson=lesson2, completed=True)
    category = IncidentCategory.objects.create(name="Phishing")
    Incident.objects.create(
        title="Test", description="...", category=category, reporter=user
    )

    response = client.post("/api/v1/certificates/issue", {"tier": "gold"})
    assert response.status_code == 201
    assert response.json()["data"]["tier"] == "gold"


def test_cannot_issue_same_tier_twice(authed_client):
    client, user = authed_client
    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    lesson = Lesson.objects.create(title="Intro", content="...", zone=zone)
    LessonProgress.objects.create(user=user, lesson=lesson, completed=True)

    first = client.post("/api/v1/certificates/issue", {"tier": "bronze"})
    second = client.post("/api/v1/certificates/issue", {"tier": "bronze"})

    assert first.status_code == 201
    assert second.status_code == 422


def test_verify_endpoint_is_public_and_returns_validity(authed_client):
    client, user = authed_client
    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    lesson = Lesson.objects.create(title="Intro", content="...", zone=zone)
    LessonProgress.objects.create(user=user, lesson=lesson, completed=True)
    issue_response = client.post("/api/v1/certificates/issue", {"tier": "bronze"})
    cert_code = issue_response.json()["data"]["cert_code"]

    public_client = APIClient()  # no auth
    response = public_client.get(f"/api/v1/certificates/verify/{cert_code}")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["holder_name"] == user.name
    assert body["is_valid"] is True


def test_verify_unknown_code_returns_404(authed_client):
    client, _ = authed_client
    response = APIClient().get("/api/v1/certificates/verify/DC-DOESNOTEXIST")
    assert response.status_code == 404
