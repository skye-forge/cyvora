import random
import string


def generate_reference_code(prefix: str, length: int = 4) -> str:
    """
    generate_reference_code("CV") -> "CV-9921"
    Used for incident report refs, certificate verification codes, etc.
    Uniqueness must still be checked against the DB at the call site —
    this only generates the candidate string.
    """
    digits = "".join(random.choices(string.digits, k=length))
    return f"{prefix}-{digits}"


def generate_unique_reference_code(
    prefix: str, model_cls, field_name: str = "reference_code", length: int = 4
) -> str:
    """Retries until it finds a code not already used by model_cls."""
    for _ in range(20):
        candidate = generate_reference_code(prefix, length)
        if not model_cls.objects.filter(**{field_name: candidate}).exists():
            return candidate
    raise RuntimeError(
        f"Could not generate a unique reference code for {model_cls.__name__} after 20 attempts"
    )
