from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation returned by /auth/me and nested elsewhere."""

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "language",
            "role",
            "xp_points",
            "level",
            "streak_count",
            "is_verified",
            "created_at",
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    otpChannel = serializers.ChoiceField(choices=["email", "sms"], required=False, default="email")

    class Meta:
        model = User
        fields = ["name", "email", "phone", "language", "password", "otpChannel"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value


class LoginSerializer(serializers.Serializer):
    """`email` accepts either an email address or a phone number —
    see apps.accounts.services.EmailOrPhoneBackend. Field name kept as
    `email` for backward compatibility with existing API clients."""

    email = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "phone", "language"]


class VerifyOtpSerializer(serializers.Serializer):
    pendingId = serializers.UUIDField()
    code = serializers.CharField(min_length=6, max_length=6)


class ResendOtpSerializer(serializers.Serializer):
    pendingId = serializers.UUIDField()
