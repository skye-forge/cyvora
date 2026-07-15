# MTN Mobile Money client stub. Wire in the real MoMo Collections API
# (https://momodeveloper.mtn.com) once sandbox credentials are available.
# The contract below (initiate -> dict) is what gateway.py depends on.

import uuid


def initiate_payment(*, payment) -> dict:
    """
    TODO: replace with a real MoMo Collections "Request to Pay" call.
    Returns whatever the caller needs to show the user (a USSD prompt
    confirmation, typically — MoMo doesn't use redirect URLs).
    """
    return {
        "provider_reference": f"momo_{uuid.uuid4().hex[:12]}",
        "instructions": "Approve the payment prompt sent to your MTN MoMo number.",
    }


def verify_webhook_payload(payload: dict) -> dict:
    """
    TODO: map MoMo's actual callback payload shape to this normalized dict.
    """
    return {
        "provider_reference": payload.get("referenceId"),
        "status": "success" if payload.get("status") == "SUCCESSFUL" else "failed",
    }
