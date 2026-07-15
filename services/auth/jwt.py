from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User


def issue_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
