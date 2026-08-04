from drf_spectacular.utils import extend_schema
from rest_framework import generics, serializers
from rest_framework.exceptions import ValidationError

from api.responses import build_success_response_schema

from shared.permissions.roles import IsSuperAdmin
from . import selectors
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    Read-only. No create/update/delete endpoints exist for this resource —
    audit rows are only ever written by the signal receiver, never via API.
    """

    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        params = self.request.query_params
        qs = selectors.all_logs()

        verb_prefix = params.get("verb")
        if verb_prefix:
            qs = qs.filter(verb__startswith=verb_prefix)

        actor_id = params.get("actor_id")
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        start = params.get("start")
        end = params.get("end")
        if start or end:
            qs = selectors.logs_in_range(start=start or None, end=end or None) & qs

        return qs


class AuditLogDetailView(generics.RetrieveAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    queryset = selectors.all_logs()

    @extend_schema(responses={200: build_success_response_schema(AuditLogSerializer())})
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
