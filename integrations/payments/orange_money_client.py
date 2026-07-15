# Orange Money client stub — same contract as momo_client.py.
import uuid


def initiate_payment(*, payment) -> dict:
    return {
        "provider_reference": f"om_{uuid.uuid4().hex[:12]}",
        "instructions": "Approve the payment prompt sent to your Orange Money number.",
    }


def verify_webhook_payload(payload: dict) -> dict:
    return {
        "provider_reference": payload.get("txnid"),
        "status": "success" if payload.get("status") == "SUCCESS" else "failed",
    }
