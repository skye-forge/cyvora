from django.contrib.auth import authenticate

from apps.accounts.models import User
from shared.exceptions import AuthenticationFailedError


def authenticate_user(*, email: str, password: str) -> User:
    user = authenticate(username=email, password=password)
    if user is None:
        raise AuthenticationFailedError("Invalid email or password.")
    if not user.is_active:
        raise AuthenticationFailedError("This account has been deactivated.")
    return user
