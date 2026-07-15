from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors, services
from .models import Institution, InstitutionLicensePricing
from .serializers import (
    InstitutionSerializer,
    InstitutionRegisterSerializer,
    LicensePurchaseSerializer,
    LicensePricingSerializer,
    EnrollUserSerializer,
    MembershipSerializer,
)


class InstitutionRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InstitutionRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        institution = services.register_institution(
            actor=request.user, **serializer.validated_data
        )
        return Response(
            {"success": True, "result": InstitutionSerializer(institution).data},
            status=201,
        )


class MyInstitutionsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InstitutionSerializer

    def get_queryset(self):
        return selectors.get_user_institutions(self.request.user)


class LicensePricingListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LicensePricingSerializer
    queryset = InstitutionLicensePricing.objects.filter(is_active=True)


class InstitutionLicensePurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = LicensePurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        institution = Institution.objects.get(pk=pk)
        result = services.initiate_license_purchase(
            actor=request.user, institution=institution, **serializer.validated_data
        )
        return Response({"success": True, "result": result})


class InstitutionMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        institution = Institution.objects.get(pk=pk)
        members = selectors.get_members(institution)
        return Response(
            {"success": True, "results": MembershipSerializer(members, many=True).data}
        )


class InstitutionEnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = EnrollUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from django.contrib.auth import get_user_model

        User = get_user_model()

        institution = Institution.objects.get(pk=pk)
        target_user = User.objects.get(id=serializer.validated_data["user_id"])

        membership = services.enroll_user(
            actor=request.user,
            institution=institution,
            target_user=target_user,
            role=serializer.validated_data["role"],
        )
        return Response(
            {"success": True, "result": MembershipSerializer(membership).data},
            status=201,
        )


class InstitutionProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        institution = Institution.objects.get(pk=pk)
        data = services.get_institution_progress(institution=institution)
        return Response({"success": True, "result": data})
