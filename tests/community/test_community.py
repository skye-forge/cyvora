import pytest
from rest_framework.test import APIClient

from apps.community.models import CommunityPost
from tests.accounts.factories import UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def authed_client():
    client = APIClient()
    user = UserFactory(email="poster@varnis.cm", password="TestPass123")
    client.force_authenticate(user=user)
    return client, user


def test_clean_tip_is_auto_published(authed_client):
    client, user = authed_client
    response = client.post(
        "/api/v1/community/",
        {
            "content": "Watch out for fake bank SMS this week.",
            "tags": ["#SafetyTip"],
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["data"] is not None
    post = CommunityPost.objects.get()
    assert post.moderation_status == CommunityPost.MODERATION_APPROVED
    assert post.author == user


def test_flagged_tip_requires_review_and_is_hidden_from_feed(authed_client):
    client, _ = authed_client
    response = client.post(
        "/api/v1/community/",
        {
            "content": "Guaranteed winner! Send your pin now.",
        },
        format="json",
    )

    assert response.status_code == 201
    post = CommunityPost.objects.get()
    assert post.moderation_status == CommunityPost.MODERATION_PENDING

    feed = client.get("/api/v1/community/")
    assert feed.json()["data"] == []


def test_feed_filters_by_tag(authed_client):
    client, user = authed_client
    CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_TIP,
        author=user,
        content="A",
        tags=["#ScamAlert"],
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )
    CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_TIP,
        author=user,
        content="B",
        tags=["#SafetyTip"],
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )

    response = client.get("/api/v1/community/?tag=%23ScamAlert")

    assert len(response.json()["data"]) == 1
    assert response.json()["data"][0]["content"] == "A"


def test_alert_posts_never_expose_author(authed_client):
    client, user = authed_client
    post = CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_ALERT,
        author=None,
        content="Verified alert",
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )

    response = client.get("/api/v1/community/")

    data = next(item for item in response.json()["data"] if item["id"] == post.id)
    assert data["author_name"] is None


def test_like_toggles_on_and_off(authed_client):
    client, user = authed_client
    post = CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_TIP,
        author=user,
        content="Tip",
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )

    first = client.post(f"/api/v1/community/{post.id}/like")
    assert first.json()["data"]["liked"] is True
    assert first.json()["data"]["likes_count"] == 1

    second = client.post(f"/api/v1/community/{post.id}/like")
    assert second.json()["data"]["liked"] is False
    assert second.json()["data"]["likes_count"] == 0


def test_comment_increments_count(authed_client):
    client, user = authed_client
    post = CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_TIP,
        author=user,
        content="Tip",
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )

    response = client.post(
        f"/api/v1/community/{post.id}/comments", {"content": "Thanks for sharing!"}
    )

    assert response.status_code == 201
    post.refresh_from_db()
    assert post.comments_count == 1


def test_reporting_same_post_twice_is_rejected(authed_client):
    client, user = authed_client
    post = CommunityPost.objects.create(
        post_type=CommunityPost.TYPE_TIP,
        author=user,
        content="Tip",
        moderation_status=CommunityPost.MODERATION_APPROVED,
    )

    first = client.post(f"/api/v1/community/{post.id}/report", {"reason": "spam"})
    second = client.post(f"/api/v1/community/{post.id}/report", {"reason": "spam"})

    assert first.status_code == 201
    assert second.status_code == 422
