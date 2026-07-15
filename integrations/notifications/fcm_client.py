from firebase_admin import messaging


def send_multicast_push(
    *, tokens: list[str], title: str, body: str, data: dict | None = None
):
    """
    Thin wrapper around firebase_admin multicast send.
    Assumes firebase_admin.initialize_app() has already been called
    at Django startup (see core/apps.py or settings/base.py).
    """
    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
        tokens=tokens,
    )
    response = messaging.send_each_for_multicast(message)

    if response.failure_count:
        failed_tokens = [
            tokens[i] for i, r in enumerate(response.responses) if not r.success
        ]
        _cleanup_invalid_tokens(failed_tokens)

    return response


def _cleanup_invalid_tokens(failed_tokens: list[str]):
    """Best-effort: unset fcm_token for devices that rejected the push (uninstalled app, etc)."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    User.objects.filter(fcm_token__in=failed_tokens).update(fcm_token=None)
