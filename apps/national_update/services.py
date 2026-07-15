from django.utils import timezone

from shared.mixins.audit_loggable import log_audit_action
from shared.exceptions.base import InvalidStateTransitionError
from .models import NationalUpdate


def create_update(*, actor, validated_data: dict) -> NationalUpdate:
    update = NationalUpdate.objects.create(**validated_data, published_by=actor)
    log_audit_action(
        actor, "national_update.created", update, {"title": update.title_en}
    )
    return update


def edit_update(
    *, actor, update: NationalUpdate, validated_data: dict
) -> NationalUpdate:
    if update.is_published:
        raise InvalidStateTransitionError(
            "Cannot edit a National Update after it has been published."
        )

    for field, value in validated_data.items():
        setattr(update, field, value)
    update.save()

    log_audit_action(
        actor, "national_update.edited", update, {"fields": list(validated_data.keys())}
    )
    return update


def publish_update(*, actor, update: NationalUpdate) -> NationalUpdate:
    """
    FR-NAT-04: marks the update published and enqueues the async push
    fan-out task. The task itself is idempotent-guarded by push_dispatched
    so retries never double-send.
    """
    if update.is_published:
        raise InvalidStateTransitionError(
            "This National Update has already been published."
        )

    update.is_published = True
    update.published_by = actor
    update.published_at = timezone.now()
    update.save(update_fields=["is_published", "published_by", "published_at"])

    log_audit_action(
        actor,
        "national_update.published",
        update,
        {"region_scope": update.region_scope},
    )

    from .tasks import dispatch_national_update_push

    dispatch_national_update_push.delay(str(update.id))

    return update
