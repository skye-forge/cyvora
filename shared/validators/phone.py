import re

from django.core.exceptions import ValidationError

CAMEROON_PHONE_REGEX = re.compile(r"^(\+237)?6[5-9]\d{7}$")


def validate_cameroon_phone(value: str) -> None:
    if not CAMEROON_PHONE_REGEX.match(value.replace(" ", "")):
        raise ValidationError(
            "Enter a valid Cameroonian phone number, e.g. +237670000000."
        )
