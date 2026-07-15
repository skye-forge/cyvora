from rest_framework import serializers
from shared.constants import CertificateTier
from shared.enums.certification import PaymentProvider

from .models import Payment


class InitiateCheckoutSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=CertificateTier.CHOICES)
    provider = serializers.ChoiceField(
        choices=[(p.value, p.value) for p in PaymentProvider]
    )


class ConfirmPaymentSerializer(serializers.Serializer):
    transaction_ref = serializers.CharField()
    success = serializers.BooleanField()


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "transaction_ref",
            "purpose",
            "amount",
            "currency",
            "provider",
            "status",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields
