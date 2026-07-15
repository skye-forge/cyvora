from django.db.models import Q, QuerySet
from .models import NationalUpdate


def published_updates() -> QuerySet[NationalUpdate]:
    return NationalUpdate.objects.filter(is_published=True)


def get_updates_for_user(
    *, region: str | None, category: str | None = None
) -> QuerySet[NationalUpdate]:
    """
    FR-NAT-01/02: an update targets everyone if region_scope is empty,
    otherwise only users whose region is in the scope list.
    """
    qs = published_updates()

    if region:
        qs = qs.filter(Q(region_scope=[]) | Q(region_scope__contains=[region]))

    if category:
        qs = qs.filter(category=category)

    return qs


def get_target_users_for_update(update: NationalUpdate):
    """
    Resolves the actual recipient list for push fan-out (FR-NAT-04).
    Only users with push notifications enabled and a registered device token.
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()

    qs = (
        User.objects.filter(is_active=True, push_notifications_enabled=True)
        .exclude(fcm_token__isnull=True)
        .exclude(fcm_token="")
    )

    if not update.is_national():
        qs = qs.filter(region__in=update.region_scope)

    return qs
