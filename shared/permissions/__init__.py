from .roles import (
    IsModerator,
    IsLegalEditor,
    IsInstitutionAdmin,
    IsSuperAdmin,
    IsNationalPublisher,
    HasRole,
)
from .ownership import IsOwnerOrReadOnly

__all__ = [
    "HasRole",
    "IsModerator",
    "IsLegalEditor",
    "IsInstitutionAdmin",
    "IsSuperAdmin",
    "IsNationalPublisher",
    "IsOwnerOrReadOnly",
]
