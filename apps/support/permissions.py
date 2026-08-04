from rest_framework.permissions import BasePermission


class IsTicketOwner(BasePermission):
    """Citizen may only access their own tickets."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id


class IsSupportAgent(BasePermission):
    """User must have a SupportAgentProfile (or be staff) to hit agent-only endpoints."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or hasattr(user, "support_agent_profile"))
        )


class IsTicketOwnerOrAssignedAgent(BasePermission):
    """Used for message history / detail views — either party in the chat may read it."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if obj.user_id == user.id:
            return True
        if obj.assigned_agent_id == user.id:
            return True
        return user.is_staff
