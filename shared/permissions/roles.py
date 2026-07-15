from rest_framework.permissions import BasePermission
from shared.constants.roles import Roles

class HasRole(BasePermission):
    """Base class — subclass and set `required_role`."""

    required_role = None

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == self.required_role)
        )


class IsModerator(HasRole):
    required_role = "moderator"


class IsLegalEditor(HasRole):
    required_role = "legal_editor"


class IsInstitutionAdmin(HasRole):
    required_role = "institution_admin"


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class IsNationalPublisher(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == Roles.NATIONAL_PUBLISHER)
        )
