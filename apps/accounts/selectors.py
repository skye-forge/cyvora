from shared.exceptions import NotFoundError

from .models import User


def get_user_by_id(user_id) -> User:
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise NotFoundError("User not found.")


def get_user_by_email(email: str) -> User | None:
    return User.objects.filter(email__iexact=email).first()
