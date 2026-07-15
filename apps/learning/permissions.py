from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsLearningAdmin(BasePermission):
    """
    Read:
        Any authenticated user.

    Write:
        Learning managers, moderators, superusers.
    """

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        user = request.user

        if not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or getattr(user, "is_staff", False)
            or getattr(user, "role", None)
            in [
                "SUPER_ADMIN",
                "NATIONAL_ADMIN",
                "LEARNING_MANAGER",
                "MODERATOR",
            ]
        )
