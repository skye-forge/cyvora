from rest_framework import serializers
from .models import Certificate, CertificatePricing


class CertificateSerializer(serializers.ModelSerializer):
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "tier",
            "cert_code",
            "pdf_url",
            "qr_url",
            "issued_at",
            "expires_at",
            "is_valid",
        ]
        read_only_fields = fields

    def get_is_valid(self, obj):
        return obj.is_valid()


class CertificatePricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatePricing
        fields = ["tier", "amount", "currency"]
        read_only_fields = fields


class InitiatePurchaseSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=["bronze", "silver", "gold"])
    provider = serializers.ChoiceField(choices=["momo", "orange_money", "card"])


class VerifyResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    holder_name = serializers.CharField(required=False)
    tier = serializers.CharField(required=False)
    issued_at = serializers.DateTimeField(required=False)
    expires_at = serializers.DateTimeField(required=False)
    reason = serializers.CharField(required=False)
