from rest_framework.permissions import BasePermission


class IsSystemAdmin(BasePermission):
    message = "Only system administrators may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "system_admin")


class IsInstitutionAdmin(BasePermission):
    message = "Only institution administrators may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "institution_admin")


class IsCitizen(BasePermission):
    message = "Only citizen accounts may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "citizen")


class IsModerator(BasePermission):
    message = "Only moderators or system administrators may perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("moderator", "system_admin"),
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level permission: the request user owns the object, or is an admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("system_admin", "institution_admin"):
            return True
        owner_id = getattr(obj, "user_id", None)
        return owner_id == request.user.id


#
# Role-based permissions referenced across payments/, kyc/, and tracking/.
# Assumes your User model has a `role` field (or a `groups` relation) —
# adjust ROLE_FIELD / the checks below to match your actual accounts app.
# Import as: from api.permissions import IsFinanceOrAdmin, IsKYCReviewerOrAdmin, ...

class RoleBasedPermission(BasePermission):
    """
    Base class — subclasses set `allowed_roles`. Checks request.user.role
    if present, falling back to Django's is_staff/is_superuser so this
    still works before a custom roles system exists.
    """

    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        role = getattr(user, "role", None)
        if role is not None:
            return role in self.allowed_roles
        # Fallback while a dedicated roles system isn't wired up yet:
        return user.is_staff


class IsFinanceOrAdmin(RoleBasedPermission):
    """Payment configuration + submission review (payments/)."""

    allowed_roles = ("FINANCE", "ADMIN")


class IsKYCReviewerOrAdmin(RoleBasedPermission):
    """KYC submission review (kyc/)."""

    allowed_roles = ("KYC_REVIEWER", "ADMIN")


class IsOwnershipReviewerOrAdmin(RoleBasedPermission):
    """Ownership-verification scoring on a tracking request (tracking/)."""

    allowed_roles = ("OWNERSHIP_REVIEWER", "ADMIN")


class IsCaseOfficerOrAdmin(RoleBasedPermission):
    """Authority assignment + investigation status updates (tracking/)."""

    allowed_roles = ("CASE_OFFICER", "ADMIN")
