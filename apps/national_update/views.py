from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions.roles import IsNationalPublisher

from . import selectors, services
from .models import NationalUpdate
from .serializers import (
    NationalUpdateListSerializer,
    NationalUpdateDetailSerializer,
    NationalUpdateAdminSerializer,
)

# ---------- Citizen-facing (read-only) ----------


class NationalUpdateListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NationalUpdateListSerializer

    def get_queryset(self):
        user = self.request.user
        category = self.request.query_params.get("category")
        return selectors.get_updates_for_user(
            region=getattr(user, "region", None), category=category
        )


class NationalUpdateDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = NationalUpdateDetailSerializer
    queryset = selectors.published_updates()


# ---------- Admin (national publisher) — imported into admin_console/urls.py ----------


class AdminNationalUpdateListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsNationalPublisher]
    serializer_class = NationalUpdateAdminSerializer
    queryset = NationalUpdate.objects.all()

    def perform_create(self, serializer):
        self.instance = services.create_update(
            actor=self.request.user, validated_data=serializer.validated_data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        out = NationalUpdateAdminSerializer(self.instance)
        return Response({"success": True, "result": out.data}, status=201)


class AdminNationalUpdateDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsNationalPublisher]
    serializer_class = NationalUpdateAdminSerializer
    queryset = NationalUpdate.objects.all()

    def perform_update(self, serializer):
        services.edit_update(
            actor=self.request.user,
            update=self.get_object(),
            validated_data=serializer.validated_data,
        )


class AdminNationalUpdatePublishView(APIView):
    permission_classes = [IsNationalPublisher]

    def post(self, request, pk):
        update = NationalUpdate.objects.get(pk=pk)
        update = services.publish_update(actor=request.user, update=update)
        return Response(
            {
                "success": True,
                "is_published": update.is_published,
                "published_at": update.published_at,
            }
        )
