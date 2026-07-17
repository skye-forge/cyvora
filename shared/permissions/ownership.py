from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """
    Read allowed for anyone permitted by the view's other permission
    classes; write (edit/delete) only allowed for the object's owner.
    Assumes the object exposes an `author` or `user` attribute —
    checks both since different models in this codebase name it differently
    (CommunityPost.author, Payment.user, etc).
    """

    owner_field_candidates = ("author", "user")

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        for field in self.owner_field_candidates:
            if hasattr(obj, field):
                return getattr(obj, field) == request.user

        return False
