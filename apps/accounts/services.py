from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.backends import ModelBackend
from rest_framework_simplejwt.tokens import RefreshToken

from shared.exceptions import AuthenticationFailedError, ValidationFailedError

from .models import User


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
    *, name: str, email: str, password: str, phone: str = None, language: str = "fr"
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
