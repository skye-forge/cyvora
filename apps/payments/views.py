import logging

from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from api.responses import error_response, success_response
from services.payments.checkout import initiate_certificate_checkout
from services.payments.confirmation import confirm_payment
from services.payments import selectors
from shared.mixins import ServiceExceptionHandlingMixin
from shared.webhook_security import compute_hmac_sha256, constant_time_equals

from .serializers import (
    ConfirmPaymentSerializer,
    InitiateCheckoutSerializer,
    PaymentSerializer,
)

logger = logging.getLogger("payments")


class InitiateCheckoutView(ServiceExceptionHandlingMixin, APIView):
    """POST /api/v1/payments/checkout — body: {"tier": "gold", "provider": "momo"}
    FR-CERT-02: payment step before releasing a certificate."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiateCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = initiate_certificate_checkout(
            user=request.user, **serializer.validated_data
        )
        return success_response(
            data=PaymentSerializer(payment).data,
            message="Complete payment at the provided checkout_url to receive your certificate.",
            status=201,
        )


class PaymentStatusView(ServiceExceptionHandlingMixin, APIView):
    """GET /api/v1/payments/{id} — polling fallback for clients that
    don't want to wait on a push notification for payment confirmation."""

    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        payment = selectors.get_payment_for_user(payment_id, request.user)
        return success_response(data=PaymentSerializer(payment).data)


class PaymentWebhookView(ServiceExceptionHandlingMixin, APIView):
    """
    POST /api/v1/payments/webhook/{provider}
    Header: X-Webhook-Signature: hex(HMAC-SHA256(secret, raw_body))

    Machine-to-machine callback from the payment provider. Verified with
    a provider-specific shared secret (PAYMENT_WEBHOOK_SECRETS in
    settings) — the exact header name and digest scheme are provider-
    dependent in reality (MTN, Orange, and card processors each define
    their own), so this is the generic shape until real credentials
    dictate the actual one per provider. What must NOT change later:
    verify-before-parse, constant-time comparison, and reject-if-
    unconfigured-outside-DEBUG — those are the parts that make this
    safe regardless of which provider is behind it.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, provider):
        if not self._has_valid_signature(request, provider):
            logger.warning(
                "Rejected payment webhook with invalid signature | provider=%s",
                provider,
            )
            return error_response("Invalid webhook signature.", status=400)

        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = confirm_payment(**serializer.validated_data)
        return success_response(data=PaymentSerializer(payment).data)

    def _has_valid_signature(self, request, provider: str) -> bool:
        secret = settings.PAYMENT_WEBHOOK_SECRETS.get(provider, "")
        if not secret:
            if settings.DEBUG:
                return True
            logger.error(
                "No webhook secret configured for provider '%s' outside DEBUG.",
                provider,
            )
            return False

        signature = request.headers.get("X-Webhook-Signature", "")
        if not signature:
            return False

        expected = compute_hmac_sha256(secret.encode("utf-8"), request.body).hex()
        return constant_time_equals(expected.encode("utf-8"), signature.encode("utf-8"))
