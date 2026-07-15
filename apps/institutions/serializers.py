from rest_framework import serializers
from .models import Institution, InstitutionMembership, InstitutionLicensePricing


class InstitutionSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = [
            "id",
            "name",
            "type",
            "region",
            "logo_url",
            "subscription_tier",
            "expires_at",
            "is_active",
        ]

    def get_is_active(self, obj):
        return obj.is_active()


class InstitutionRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    type = serializers.ChoiceField(
        choices=["school", "bank", "ngo", "government", "corporate"]
    )
    region = serializers.CharField(max_length=100)
    logo_url = serializers.URLField(required=False, allow_blank=True)


class LicensePurchaseSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=["basic", "standard", "premium"])
    provider = serializers.ChoiceField(choices=["momo", "orange_money", "card"])


class LicensePricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionLicensePricing
        fields = ["tier", "amount", "currency", "seat_limit"]


class EnrollUserSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=["admin", "member"], default="member")


class MembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = InstitutionMembership
        fields = ["id", "user", "user_name", "role", "created_at"]
