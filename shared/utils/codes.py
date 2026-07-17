import uuid
import random
import string


def generate_unique_code(prefix: str = "") -> str:
    """
    Opaque unique code for certificates, payment refs, etc. — collision
    probability is astronomically low (40 bits of entropy) so no DB
    check is needed for these use cases.
    """
    return f"{prefix}{uuid.uuid4().hex[:10].upper()}"


def generate_short_reference(
    prefix: str, model_cls, field_name: str, digits: int = 4
) -> str:
    """
    Short, human-typeable/scannable reference like #CV-9921 — used for
    incident report refs (FR-INC-07), where a citizen may need to read
    the code aloud. Low entropy at 4 digits, so THIS one does check the
    DB for collisions and retries, unlike generate_unique_code above.
    """
    for _ in range(20):
        candidate = f"{prefix}-{''.join(random.choices(string.digits, k=digits))}"
        if not model_cls.objects.filter(**{field_name: candidate}).exists():
            return candidate
    raise RuntimeError(
        f"Could not generate a unique reference for {model_cls.__name__} after 20 attempts"
    )
