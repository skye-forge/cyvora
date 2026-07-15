import pytest
from rest_framework.test import APIClient

from tests.accounts.factories import UserFactory
from apps.incidents.models import Incident, IncidentCategory

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


def test_citizen_cannot_moderate_a_report(authed_client):
    client, user = authed_client
    category = IncidentCategory.objects.create(name="Phishing")
    incident = Incident.objects.create(
        report_reference="CV-0005",
        category=category,
        description="...",
        reporter=user,
    )

    response = client.patch(
        f"/api/v1/incidents/{incident.id}/moderate", {"status": "approved"}
    )

    assert response.status_code == 403


def test_moderator_can_approve_report_and_it_publishes_a_community_alert(authed_client):
    client, user = authed_client
    moderator = UserFactory(
        email="mod@varnis.cm", password="TestPass123", role="moderator"
    )
    mod_client = APIClient()
    mod_client.force_authenticate(user=moderator)

    category = IncidentCategory.objects.create(name="Phishing")
    incident = Incident.objects.create(
        report_reference="CV-0006",
        category=category,
        description="Fake bank site.",
        reporter=user,
    )

    response = mod_client.patch(
        f"/api/v1/incidents/{incident.id}/moderate", {"status": "approved"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "approved"

    from apps.community.models import CommunityPost

    alert = CommunityPost.objects.get(source_report=incident)
    assert alert.post_type == CommunityPost.TYPE_ALERT
    assert alert.author is None  # reporter identity withheld
    assert alert.moderation_status == CommunityPost.MODERATION_APPROVED


def test_moderator_can_reject_report_with_reason(authed_client):
    client, user = authed_client
    moderator = UserFactory(
        email="mod2@varnis.cm", password="TestPass123", role="moderator"
    )
    mod_client = APIClient()
    mod_client.force_authenticate(user=moderator)

    category = IncidentCategory.objects.create(name="Phishing")
    incident = Incident.objects.create(
        report_reference="CV-0007",
        category=category,
        description="...",
        reporter=user,
    )

    response = mod_client.patch(
        f"/api/v1/incidents/{incident.id}/moderate",
        {"status": "rejected", "reason": "Duplicate report."},
    )

    assert response.status_code == 200
    assert response.json()["data"]["rejection_reason"] == "Duplicate report."


def test_cannot_moderate_an_already_resolved_report(authed_client):
    client, user = authed_client
    moderator = UserFactory(
        email="mod3@varnis.cm", password="TestPass123", role="moderator"
    )
    mod_client = APIClient()
    mod_client.force_authenticate(user=moderator)

    category = IncidentCategory.objects.create(name="Phishing")
    incident = Incident.objects.create(
        report_reference="CV-0008",
        category=category,
        description="...",
        reporter=user,
        status=Incident.STATUS_APPROVED,
    )

    response = mod_client.patch(
        f"/api/v1/incidents/{incident.id}/moderate", {"status": "rejected"}
    )

    assert response.status_code == 422
