# Card processor stub (e.g. Stripe, Flutterwave). Same contract.
import uuid


def initiate_payment(*, payment) -> dict:
    return {
        "provider_reference": f"card_{uuid.uuid4().hex[:12]}",
        "redirect_url": f"https://checkout.example.com/pay/{payment.transaction_ref}",
    }


def verify_webhook_payload(payload: dict) -> dict:
    return {
        "provider_reference": payload.get("reference"),
        "status": "success" if payload.get("status") == "succeeded" else "failed",
    }
