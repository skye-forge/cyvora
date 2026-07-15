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


def issue_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def update_profile(*, user: User, validated_data: dict) -> User:
    for field, value in validated_data.items():
        setattr(user, field, value)
    user.save(update_fields=list(validated_data.keys()) + ["updated_at"])
    return user
