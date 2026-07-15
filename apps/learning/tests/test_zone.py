import pytest
from rest_framework.test import APIClient

from apps.learning.models import Zone


@pytest.mark.django_db
class TestZoneAPI:

    def setup_method(self):
        self.client = APIClient()

    def test_list_zones(self):
        Zone.objects.create(
            title="AI Safety",
            slug="ai-safety",
        )

        response = self.client.get("/api/v1/learning/zones/")

        assert response.status_code == 200

    def test_get_zone(self):
        zone = Zone.objects.create(
            title="Cyber Hygiene",
            slug="cyber-hygiene",
        )

        response = self.client.get(f"/api/v1/learning/zones/{zone.slug}/")

        assert response.status_code == 200
