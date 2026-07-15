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
