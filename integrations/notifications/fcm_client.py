from firebase_admin import (
    messaging,
)  # requires firebase-admin to be installed & initialized

import logging

logger = logging.getLogger(__name__)


# def send_multicast_push(
#     *, tokens: list[str], title: str, body: str, data: dict | None = None
# ):
#     """
#     Thin wrapper around firebase_admin multicast send.
#     Assumes firebase_admin.initialize_app() has already been called
#     at Django startup (see core/apps.py or settings/base.py).
#     """
#     message = messaging.MulticastMessage(
#         notification=messaging.Notification(title=title, body=body),
#         data={k: str(v) for k, v in (data or {}).items()},
#         tokens=tokens,
#     )
#     response = messaging.send_each_for_multicast(message)

#     if response.failure_count:
#         failed_tokens = [
#             tokens[i] for i, r in enumerate(response.responses) if not r.success
#         ]
#         _cleanup_invalid_tokens(failed_tokens)

#     return response


# def _cleanup_invalid_tokens(failed_tokens: list[str]):
#     """Best-effort: unset fcm_token for devices that rejected the push (uninstalled app, etc)."""
#     from django.contrib.auth import get_user_model

#     User = get_user_model()
#     User.objects.filter(fcm_token__in=failed_tokens).update(fcm_token=None)


# LOCATION: integrations/notifications/fcm_client.py
#
# Raw Firebase Cloud Messaging client. Only talks to FCM — no business
# logic, no decision about whether a user should receive a push. That
# decision lives in notifications/services.py, which calls this.
# Import as: from integrations.notifications.fcm_client import send_push_notification


def send_push_notification(
    *, device_token: str, title: str, body: str, data: dict = None
) -> bool:
    """
    Sends a single push notification via FCM. Returns True on success,
    False on failure (logs the error rather than raising, so a bad or
    stale device token never breaks the calling service-layer transaction).
    """
    if not device_token:
        logger.warning("send_push_notification called with no device_token — skipping.")
        return False

    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
        token=device_token,
    )

    try:
        messaging.send(message)
        return True
    except (
        Exception
    ) as exc:  # noqa: BLE001 — deliberately broad, this must never raise upstream
        logger.error("FCM push failed for token %s: %s", device_token, exc)
        return False


def send_push_to_multiple(
    *, device_tokens: list[str], title: str, body: str, data: dict = None
) -> dict:
    """
    Bulk send, e.g. for the weekly bulletin or a National Update broadcast.
    Returns {"success_count": int, "failure_count": int}.
    """
    if not device_tokens:
        return {"success_count": 0, "failure_count": 0}

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
        tokens=device_tokens,
    )

    try:
        response = messaging.send_multicast(message)
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count,
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("FCM multicast push failed: %s", exc)
        return {"success_count": 0, "failure_count": len(device_tokens)}
