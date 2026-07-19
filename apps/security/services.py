
from django.utils import timezone

from .models import DeviceSession, NetworkType

# No external dependency here on purpose — a 'user_agents' package import
# was here before but caused an unresolved-import warning for anyone who
# hadn't pip-installed it, and it isn't worth managing another dependency
# for this. Plain regex covers the OS families we actually care about.
import re

_OS_PATTERNS = [
    (r"Android\s*([\d.]+)?", "Android"),
    (r"iPhone OS\s*([\d_]+)?", "iOS"),
    (r"iPad.*OS\s*([\d_]+)?", "iPadOS"),
    (r"Windows NT\s*([\d.]+)?", "Windows"),
    (r"Mac OS X\s*([\d_.]+)?", "macOS"),
    (r"Linux", "Linux"),
]
_BROWSER_PATTERNS = [
    (r"Edg/([\d.]+)", "Edge"),
    (r"Chrome/([\d.]+)", "Chrome"),
    (r"Firefox/([\d.]+)", "Firefox"),
    (r"Version/([\d.]+).*Safari", "Safari"),
]


def get_client_ip(request) -> str | None:
    """Handles requests behind a proxy/load balancer (X-Forwarded-For)."""
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _describe_client(request) -> dict:
    """
    Lightweight parse of the User-Agent header. Good enough to label a
    device in the 'Logged in Devices' list — not trying to be a full
    device-detection library. Flutter clients should send device_model
    and app_version explicitly (see record_login_session) since a mobile
    app's User-Agent header is often uninformative.
    """
    ua_string = request.META.get("HTTP_USER_AGENT", "")

    os_name, os_version = "", ""
    for pattern, name in _OS_PATTERNS:
        match = re.search(pattern, ua_string)
        if match:
            os_name = name
            os_version = (match.group(1) or "").replace("_", ".")
            break

    browser_name = ""
    for pattern, name in _BROWSER_PATTERNS:
        if re.search(pattern, ua_string):
            browser_name = name
            break

    if browser_name and os_name:
        device_name = f"{browser_name} on {os_name}"
    elif os_name:
        device_name = os_name
    elif ua_string:
        device_name = ua_string[:100]
    else:
        device_name = "Unknown device"

    return {"device_name": device_name, "os_name": os_name, "os_version": os_version}


def record_login_session(
    *,
    user,
    request,
    refresh_token_jti: str = "",
    device_model: str = "",
    app_version: str = "",
) -> DeviceSession:
    """
    Called once per successful login. network_type is only reliably known
    on mobile — have the Flutter client send it as a header
    (X-Network-Type: WIFI / MOBILE_DATA) on the login request; falls back
    to UNKNOWN for web/browser logins.
    """
    client_info = _describe_client(request)
    network_header = request.META.get("HTTP_X_NETWORK_TYPE", "").upper()
    network_type = (
        network_header if network_header in NetworkType.values else NetworkType.UNKNOWN
    )

    return DeviceSession.objects.create(
        user=user,
        device_name=client_info["device_name"],
        device_model=device_model,
        os_name=client_info["os_name"],
        os_version=client_info["os_version"],
        app_version=app_version,
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        ip_address=get_client_ip(request),
        network_type=network_type,
        refresh_token_jti=refresh_token_jti,
    )


def touch_session(*, refresh_token_jti: str) -> None:
    """
    Call on token refresh (or via a lightweight middleware) to keep
    last_seen_at current for the 'Logged in Devices' screen without
    creating a new row per request.
    """
    if not refresh_token_jti:
        return
    DeviceSession.objects.filter(
        refresh_token_jti=refresh_token_jti, is_active=True
    ).update(last_seen_at=timezone.now())


def list_active_sessions(*, user):
    return DeviceSession.objects.filter(user=user, is_active=True)


def revoke_session(*, user, session_id) -> bool:
    """Logout one device. Returns False if the session wasn't found/owned by user."""
    session = DeviceSession.objects.filter(
        id=session_id, user=user, is_active=True
    ).first()
    if not session:
        return False

    session.is_active = False
    session.revoked_at = timezone.now()
    session.save(update_fields=["is_active", "revoked_at"])

    _blacklist_refresh_token(session.refresh_token_jti)
    return True


def revoke_all_sessions(*, user, except_session_id=None) -> int:
    """Logout all devices, optionally keeping the current one active."""
    qs = DeviceSession.objects.filter(user=user, is_active=True)
    if except_session_id:
        qs = qs.exclude(id=except_session_id)

    count = 0
    for session in qs:
        session.is_active = False
        session.revoked_at = timezone.now()
        session.save(update_fields=["is_active", "revoked_at"])
        _blacklist_refresh_token(session.refresh_token_jti)
        count += 1
    return count


def _blacklist_refresh_token(jti: str) -> None:
    """
    Best-effort: if rest_framework_simplejwt's token_blacklist app is
    installed, actually invalidate the refresh token. If not installed,
    the DeviceSession is still marked revoked for display/audit purposes,
    but the underlying token would remain technically valid until it
    expires naturally — flagging this so it isn't a silent gap.
    """
    if not jti:
        return
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            OutstandingToken,
            BlacklistedToken,
        )

        outstanding = OutstandingToken.objects.filter(jti=jti).first()
        if outstanding:
            BlacklistedToken.objects.get_or_create(token=outstanding)
    except ImportError:
        import logging

        logging.getLogger(__name__).warning(
            "token_blacklist app not installed — DeviceSession marked revoked "
            "but the JWT itself remains valid until natural expiry."
        )
