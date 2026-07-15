from enum import Enum


class PaymentProvider(str, Enum):
    MOMO = "momo"
    ORANGE_MONEY = "orange_money"
    CARD = "card"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentPurpose(str, Enum):
    CERTIFICATION = "certification"
    INSTITUTION_LICENSE = "institution_license", 


def django_choices(enum_cls) -> list[tuple[str, str]]:
    """Small helper so model fields don't repeat this comprehension everywhere."""
    return [(item.value, item.value.replace("_", " ").title()) for item in enum_cls]
