from celery import shared_task
from django.db import transaction

from shared.constants.notification_types import NotificationTypes


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def dispatch_national_update_push(self, update_id: str):
    """
    Fans out an in-app Notification row + FCM push to every targeted user,
    in batches (FCM multicast caps at 500 tokens per call).
    Guarded by push_dispatched so this is safe to retry.
    """
    from .models import NationalUpdate
    from .selectors import get_target_users_for_update
    from notifications.models import Notification
    from integrations.notifications.fcm_client import send_multicast_push

    try:
        update = NationalUpdate.objects.get(id=update_id)
    except NationalUpdate.DoesNotExist:
        return

    if update.push_dispatched:
        return  # already fanned out — no-op on retry/duplicate call

    users = list(get_target_users_for_update(update))
    if not users:
        _mark_dispatched(update)
        return

    # 1. Persist in-app notification rows in bulk
    notifications = [
        Notification(
            user=user,
            type=NotificationTypes.NATIONAL_ALERT,
            related_entity_id=update.id,
            message=update.title_en,
        )
        for user in users
    ]
    Notification.objects.bulk_create(notifications, batch_size=500)

    # 2. Send FCM push in batches of 500 tokens
    tokens = [u.fcm_token for u in users if u.fcm_token]
    batch_size = 500
    for i in range(0, len(tokens), batch_size):
        batch = tokens[i : i + batch_size]
        try:
            send_multicast_push(
                tokens=batch,
                title=update.title_en,
                body=update.body_en[:150],
                data={"type": "national_update", "update_id": str(update.id)},
            )
        except Exception as exc:
            raise self.retry(exc=exc)

    _mark_dispatched(update)


def _mark_dispatched(update):
    update.push_dispatched = True
    update.save(update_fields=["push_dispatched"])
