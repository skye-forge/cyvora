
from rest_framework import generics, permissions, status
from rest_framework.views import APIView

from .models import DeviceSession
from .serializers import DeviceSessionSerializer
from .services import list_active_sessions, revoke_session, revoke_all_sessions
from api.responses import api_response
from api.permissions import (
    IsFinanceOrAdmin,
)  # reuse a generic admin check; swap for a dedicated one if preferred

# ── Citizen-facing: Profile > Security > Logged in Devices ────────────────


class MyDeviceSessionsView(generics.ListAPIView):
    """GET /security/sessions/mine/"""

    serializer_class = DeviceSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return list_active_sessions(user=self.request.user)


class RevokeDeviceSessionView(APIView):
    """POST /security/sessions/{id}/revoke/  — logout one device."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        revoked = revoke_session(user=request.user, session_id=id)
        if not revoked:
            return api_response(
                success=False,
                message="Session not found or already inactive.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return api_response(success=True, message="Device logged out.")


class RevokeAllDeviceSessionsView(APIView):
    """POST /security/sessions/revoke-all/  — logout all devices.
    Pass {"keep_current": true} with the current session's refresh_token_jti
    resolved server-side if you want to preserve the active session."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        except_id = request.data.get("except_session_id")
        count = revoke_all_sessions(user=request.user, except_session_id=except_id)
        return api_response(
            success=True,
            message=f"{count} device(s) logged out.",
            data={"revoked_count": count},
        )


# ── Admin: security investigation ──────────────────────────────────────────


class AdminUserDeviceSessionsView(generics.ListAPIView):
    """GET /admin/security/sessions/?user_id=<uuid> — full history, not just active."""

    serializer_class = DeviceSessionSerializer
    permission_classes = [
        IsFinanceOrAdmin
    ]  # replace with a dedicated IsSecurityInvestigatorOrAdmin if you add one

    def get_queryset(self):
        qs = DeviceSession.objects.all()
        user_id = self.request.query_params.get("user_id")
        ip_address = self.request.query_params.get("ip_address")
        if user_id:
            qs = qs.filter(user_id=user_id)
        if ip_address:
            qs = qs.filter(ip_address=ip_address)
        return qs
