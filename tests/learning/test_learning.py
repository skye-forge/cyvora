import pytest
from rest_framework.test import APIClient

from tests.accounts.factories import UserFactory
from apps.learning.models import LearningZone, Lesson

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authed_client(api_client):
    user = UserFactory(email="learner@varnis.cm", password="TestPass123")
    api_client.force_authenticate(user=user)
    return api_client, user


def test_list_zones_shows_lock_state_based_on_xp(authed_client):
    client, user = authed_client
    LearningZone.objects.create(name="Zone 1", zone_number=1, unlock_xp=0)
    LearningZone.objects.create(name="Zone 2", zone_number=2, unlock_xp=1000)

    response = client.get("/api/v1/learning/zones")

    assert response.status_code == 200
    zones = response.json()["data"]
    assert zones[0]["is_unlocked"] is True
    assert zones[1]["is_unlocked"] is False


def test_list_lessons_for_a_zone(authed_client):
    client, _ = authed_client
    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    Lesson.objects.create(title="Intro", content="...", zone=zone, order=1)

    response = client.get(f"/api/v1/learning/zones/{zone.id}/lessons")

    assert response.status_code == 200
    assert len(response.json()["data"]) == 1


def test_complete_lesson_awards_xp(authed_client):
    client, user = authed_client
    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    lesson = Lesson.objects.create(title="Intro", content="...", zone=zone)

    response = client.post(f"/api/v1/learning/lessons/{lesson.id}/complete")

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.xp_points == 50


def test_completing_same_lesson_twice_is_rejected(authed_client):
    client, _ = authed_client
    zone = LearningZone.objects.create(name="Zone 1", zone_number=1)
    lesson = Lesson.objects.create(title="Intro", content="...", zone=zone)

    client.post(f"/api/v1/learning/lessons/{lesson.id}/complete")
    response = client.post(f"/api/v1/learning/lessons/{lesson.id}/complete")

    assert response.status_code == 422
    assert response.json()["success"] is False
