"""Enum-based choices for the VARNIS platform.

Migrate from shared/constants classes to Python enums over time.
Currently empty — constants still use class-based pseudo-enums for
Django CHOICES compatibility.
"""
# shared/enums/__init__.py — add this line to whatever you already export
from .certification import (
    PaymentProvider,
    PaymentStatus,
    PaymentPurpose,
    django_choices,
)  # noqa: F401
