from django.db import transaction
from django.utils import timezone

from apps.learning.models.zone import Zone
from shared.enums.learning import PublicationStatus
from shared.utils import generate_unique_slug


class ZoneService:

    @staticmethod
    @transaction.atomic
    def create_zone(**data):

        data["slug"] = generate_unique_slug(
            model=Zone,
            value=data["title"],
        )

        return Zone.objects.create(**data)

    @staticmethod
    @transaction.atomic
    def update_zone(zone: Zone, **data):

        if "title" in data:
            data["slug"] = generate_unique_slug(
                model=Zone,
                value=data["title"],
            )

        for field, value in data.items():
            setattr(zone, field, value)

        zone.save()

        return zone

    @staticmethod
    @transaction.atomic
    def publish_zone(zone: Zone):

        zone.status = PublicationStatus.PUBLISHED
        zone.published_at = timezone.now()

        zone.save(
            update_fields=[
                "status",
                "published_at",
                "updated_at",
            ]
        )

        return zone

    @staticmethod
    @transaction.atomic
    def archive_zone(zone: Zone):

        zone.status = PublicationStatus.ARCHIVED

        zone.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return zone
