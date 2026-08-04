from drf_spectacular.utils import extend_schema
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.responses import build_success_response_schema
from . import selectors, services
from .models import Certificate, CertificatePricing
from .serializers import (
    CertificateSerializer,
    CertificatePricingSerializer,
    InitiatePurchaseSerializer,
)


class CertificatePricingView(APIView):
    """FR-CERT-06: show all active pricing tiers transparently."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: build_success_response_schema(
                serializers.ListSerializer(child=CertificatePricingSerializer())
            )
        }
    )
    def get(self, request):
        pricing = CertificatePricing.objects.filter(is_active=True)
        serializer = CertificatePricingSerializer(pricing, many=True)
        return Response({"success": True, "data": serializer.data})


class CertificateInitiatePurchaseView(APIView):
    """POST /api/v1/certificates/purchase"""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=InitiatePurchaseSerializer,
        responses={201: build_success_response_schema(serializers.DictField())},
    )
    def post(self, request):
        serializer = InitiatePurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = services.initiate_certificate_purchase(
            user=request.user,
            tier=serializer.validated_data["tier"],
            provider=serializer.validated_data["provider"],
        )
        return Response({"success": True, "result": result})


class MyCertificatesListView(generics.ListAPIView):
    """FR-CERT-04: certificates listed under Profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        return selectors.get_user_certificates(self.request.user)


class CertificateVerifyPublicView(APIView):
    """FR-CERT-05: public verification link, no auth required."""

    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: build_success_response_schema(serializers.DictField())}
    )
    def get(self, request, cert_code):
        result = services.verify_certificate(cert_code=cert_code)
        return Response({"success": True, "result": result})
