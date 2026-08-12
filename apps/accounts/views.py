from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from api.responses import error_response, success_response
from shared.mixins import ServiceExceptionHandlingMixin

from . import services
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    ResendOtpSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    VerifyOtpSerializer,
)

def _success_envelope_schema():
    return inline_serializer(
        "AuthSuccessResponse",
        fields={
            "success": serializers.BooleanField(),
            "message": serializers.CharField(required=False, allow_blank=True),
            "data": serializers.DictField(required=False),
        },
    )


class RegisterView(ServiceExceptionHandlingMixin, APIView):
    """POST /api/v1/auth/register/"""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(
        request=RegisterSerializer,
        responses={201: _success_envelope_schema()},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = services.register_user(**serializer.validated_data)
        # tokens = services.issue_tokens(user)
        otp_channel = serializer.validated_data.get("otpChannel") or "email"
        otp = services.issue_otp(user, purpose="register", channel=otp_channel)

        return success_response(
            data={
                "otpRequired": True,
                "pendingID": str(otp.id),
                "user": UserSerializer(user).data,
            },
            message="Account created. Check your email for the verification code.",
            status=201,
        )


class LoginView(ServiceExceptionHandlingMixin, APIView):
    """POST /api/v1/auth/login/"""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(
        request=LoginSerializer,
        responses={200: _success_envelope_schema()},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = services.authenticate_user(**serializer.validated_data)
        # tokens = services.issue_tokens(user)
        otp = services.issue_otp(user, purpose="login", channel="email")

        return success_response(
            data={
                "otpRequired": True,
                "pendingID": str(otp.id),
                "user": UserSerializer(user).data,
            },
            message="Enter the verification code sent to your email to finish signing in.",
        )


class VerifyOtpView(ServiceExceptionHandlingMixin, APIView):
    """POST /api/v1/auth/otp/verify/"""

    permission_classes = [AllowAny]
    serializer_class = VerifyOtpSerializer

    @extend_schema(
        request=VerifyOtpSerializer, responses={200: _success_envelope_schema()}
    )
    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = services.verify_otp(
            pending_id=serializer.validated_data["pendingId"],
            code=serializer.validated_data["code"],
        )
        tokens = services.issue_tokens(user)
        return success_response(
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(user).data,
            },
            message="Verified.",
        )


class ResendOtpView(ServiceExceptionHandlingMixin, APIView):
    """POST /api/v1/auth/otp/resend/"""

    permission_classes = [AllowAny]
    serializer_class = ResendOtpSerializer

    @extend_schema(
        request=ResendOtpSerializer, responses={200: _success_envelope_schema()}
    )
    def post(self, request):
        serializer = ResendOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp = services.resend_otp(pending_id=serializer.validated_data["pendingId"])
        return success_response(data={"pendingId": str(otp.id)}, message="Code resent.")


class RefreshTokenView(APIView):
    """POST /api/v1/auth/refresh — body: {"refresh": "<token>"}"""

    permission_classes = [AllowAny]

    @extend_schema(
        request=inline_serializer(
            "RefreshTokenRequest",
            fields={"refresh": serializers.CharField(write_only=True)},
        ),
        responses={200: _success_envelope_schema()},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error_response("Refresh token is required.", status=400)

        try:
            refresh = RefreshToken(refresh_token)
            access = str(refresh.access_token)
        except TokenError:
            return error_response("Refresh token is invalid or expired.", status=401)

        return success_response(data={"access": access}, message="Token refreshed.")


class MeView(ServiceExceptionHandlingMixin, APIView):
    """GET /api/v1/auth/me — PATCH /api/v1/auth/me"""

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    @extend_schema(responses={200: _success_envelope_schema()})
    def get(self, request):
        return success_response(data=UserSerializer(request.user).data)

    @extend_schema(
        request=UpdateProfileSerializer,
        responses={200: _success_envelope_schema()},
    )
    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        user = services.update_profile(
            user=request.user, validated_data=serializer.validated_data
        )
        return success_response(
            data=UserSerializer(user).data, message="Profile updated."
        )
