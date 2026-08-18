from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.backends import ModelBackend
from rest_framework_simplejwt.tokens import RefreshToken

from shared.exceptions import AuthenticationFailedError, ValidationFailedError

from .models import User
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import AccountOTP
from shared.exceptions import ServiceError

class EmailOrPhoneBackend(ModelBackend):
    """Authenticate users by email or phone using the existing accounts app structure."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if not username or not password:
            return None

        identifier = username.strip()
        if not identifier:
            return None

        lookup = (
            {"email__iexact": identifier}
            if "@" in identifier
            else {"phone": identifier}
        )
        try:
            user = UserModel._default_manager.get(**lookup)
        except UserModel.DoesNotExist:
            return None
        except UserModel.MultipleObjectsReturned:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


def register_user(
    *, name: str, email: str, password: str, phone: str = None, language: str = "fr", is_active: bool = False
) -> User:
    """
    Creates a citizen account. Institution/system admin accounts are
    provisioned separately (via institution onboarding / Django admin),
    not through public self-registration.
    """
    if User.objects.filter(email__iexact=email).exists():
        raise ValidationFailedError("An account with this email already exists.")

    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        phone=phone,
        language=language,
    )
    return user


def authenticate_user(*, email: str, password: str) -> User:
    user = authenticate(username=email, password=password)
    if user is None:
        raise AuthenticationFailedError("Invalid email or password.")
    if not user.is_active:
        raise AuthenticationFailedError("This account has been deactivated.")
    return user


def issue_tokens(user: "User", request=None) -> dict:
    """
    Same as before (still sets the 'role' claim, same return shape), with
    one addition: pass `request` when this is called from an actual login
    (password, OTP verify, biometric, Google OAuth callback, etc.) and a
    DeviceSession gets recorded automatically — IP, device, network type,
    for the security investigation trail.

    `request` is optional and defaults to None so this doesn't break any
    call site you haven't updated yet (e.g. a token-refresh path that
    isn't a "login" and shouldn't create a new session row). Update each
    real login call site to pass request; leave non-login call sites as
    they are.
    """
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role  

    if request is not None:
        from apps.security.services import record_login_session

        record_login_session(
            user=user,
            request=request,
            refresh_token_jti=refresh["jti"],
            device_model=(
                request.data.get("device_model", "") if hasattr(request, "data") else ""
            ),
            app_version=(
                request.data.get("app_version", "") if hasattr(request, "data") else ""
            ),
        )

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def update_profile(*, user: User, validated_data: dict) -> User:
    for field, value in validated_data.items():
        setattr(user, field, value)
    user.save(update_fields=list(validated_data.keys()) + ["updated_at"])
    return user


OTP_TTL_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 45


def _generate_code():
    return f"{random.randint(0, 999999):06d}"


from apps.notifications.tasks import send_email_task


def _send_otp_email(user, code):
    # Called directly (NOT .delay()) — an OTP code is something the user is
    # actively waiting on, unlike the welcome email. Queuing it through
    # Celery makes the broker a single point of failure on a path where the
    # person is already looking at a "check your email" screen. Calling the
    # task object directly runs send_email_task's exact same logic
    # in-process, synchronously, with no dependency on Redis at all.
    send_email_task(
        to=user.email,
        subject=(
            "Your Varnis verification code"
            if user.language == "en"
            else "Votre code de vérification Varnis"
        ),
        template_name="emails/otp_code.html",
        context={
            "name": user.name,
            "code": code,
            "minutes": OTP_TTL_MINUTES,
            "language": user.language,
        },
    )


def issue_otp(user, purpose, channel="email"):
    """Create a fresh OTP and email the code. Wipes any previous unconsumed
    OTP for the same user+purpose so only the newest code ever works."""
    AccountOTP.objects.filter(
        user=user, purpose=purpose, consumed_at__isnull=True
    ).delete()
    code = _generate_code()
    otp = AccountOTP.objects.create(
        user=user,
        purpose=purpose,
        channel=channel,
        code_hash=make_password(code),
        expires_at=timezone.now() + timedelta(minutes=OTP_TTL_MINUTES),
    )
    _send_otp_email(user, code)
    return otp


def verify_otp(pending_id, code):
    try:
        otp = AccountOTP.objects.select_related("user").get(id=pending_id)
    except (
        AccountOTP.DoesNotExist,
        ValueError,
        ValidationError,
    ):
        raise ServiceError("Invalid or expired verification code.", status=400)

    if otp.is_consumed():
        raise ServiceError("This code has already been used.", status=400)
    if otp.is_expired():
        raise ServiceError("This code has expired. Request a new one.", status=400)
    if otp.attempts >= otp.max_attempts:
        raise ServiceError("Too many attempts. Request a new code.", status=429)

    if not check_password(code, otp.code_hash):
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        raise ServiceError("Incorrect code.", status=400)

    otp.consumed_at = timezone.now()
    otp.save(update_fields=["consumed_at"])

    user = otp.user
    if otp.purpose == AccountOTP.Purpose.REGISTER and not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])
    return user


def resend_otp(pending_id):
    try:
        otp = AccountOTP.objects.select_related("user").get(id=pending_id)
    except (AccountOTP.DoesNotExist, ValueError):
        raise ServiceError("Invalid verification session.", status=400)
    if otp.is_consumed():
        raise ServiceError("This session has already been verified.", status=400)
    if timezone.now() < otp.created_at + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS):
        raise ServiceError("Please wait before requesting another code.", status=429)
    return issue_otp(otp.user, otp.purpose, otp.channel)
