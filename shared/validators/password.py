import re

from django.core.exceptions import ValidationError


def validate_strong_password(value: str) -> None:
    if len(value) < 8:
        raise ValidationError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValidationError("Password must contain both letters and numbers.")
