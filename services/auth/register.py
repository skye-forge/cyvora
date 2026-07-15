from apps.accounts.models import User
from shared.exceptions import ValidationFailedError


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

    return User.objects.create_user(
        email=email,
        password=password,
        name=name,
        phone=phone,
        language=language,
    )


def update_profile(*, user: User, validated_data: dict) -> User:
    for field, value in validated_data.items():
        setattr(user, field, value)
    user.save(update_fields=list(validated_data.keys()) + ["updated_at"])
    return user
