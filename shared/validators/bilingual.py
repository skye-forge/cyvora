from django.core.exceptions import ValidationError


def validate_bilingual_pair(data: dict, base_field: str) -> None:
    """
    Ensures both `{base_field}_en` and `{base_field}_fr` are present and
    non-empty on admin-authored content — NFR-05 requires full bilingual
    support, so content can't be published half-translated.
    """
    en_value = data.get(f"{base_field}_en", "")
    fr_value = data.get(f"{base_field}_fr", "")

    if not en_value or not fr_value:
        raise ValidationError(
            f"Both '{base_field}_en' and '{base_field}_fr' are required."
        )
