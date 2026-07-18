
#
# Single entry point every other app should call: notify_user(user, event, context).
# This is what kyc/services.py, tracking/services.py, and payments/services.py
# import instead of touching fcm_client or the email client directly — keeps
# channel choice (push vs email vs in-app-only) out of the business apps.
#
# ASSUMPTION FLAGGED: this file calls integrations.email.client.send_email(
# to_email, subject, body). If your actual function name/signature in
# integrations/email/client.py differs, update _send_email() below —
# everything else in this file is unaffected.

import logging

from django.conf import settings

from .models import Notification, NotificationCategory

logger = logging.getLogger(__name__)

# event -> (category, title_en, title_fr, body_template, send_email)
# body_template uses str.format(**context)
EVENT_TEMPLATES = {
    "kyc_submitted": (
        NotificationCategory.KYC,
        "KYC Submitted",
        "KYC Soumis",
        "Your identity verification has been submitted for review.",
        False,
    ),
    "kyc_approved": (
        NotificationCategory.KYC,
        "KYC Approved",
        "KYC Approuvé",
        "Your identity has been verified.",
        True,
    ),
    "kyc_rejected": (
        NotificationCategory.KYC,
        "KYC Rejected",
        "KYC Rejeté",
        "Your identity verification was rejected. Please review and resubmit.",
        True,
    ),
    "kyc_expired": (
        NotificationCategory.KYC,
        "KYC Expired",
        "KYC Expiré",
        "Your identity verification has expired. Please renew it.",
        True,
    ),
    "payment_submitted": (
        NotificationCategory.PAYMENT,
        "Payment Received",
        "Paiement Reçu",
        "We received your payment proof and it is under review.",
        False,
    ),
    "payment_verified": (
        NotificationCategory.PAYMENT,
        "Payment Verified",
        "Paiement Vérifié",
        "Your payment has been verified.",
        True,
    ),
    "payment_rejected": (
        NotificationCategory.PAYMENT,
        "Payment Rejected",
        "Paiement Rejeté",
        "Your payment could not be verified. Please check the details.",
        True,
    ),
    "payment_proof_requested": (
        NotificationCategory.PAYMENT,
        "Proof Needed",
        "Preuve Requise",
        "Please upload a new or clearer payment proof.",
        True,
    ),
    "tracking_status_changed": (
        NotificationCategory.TRACKING,
        "Tracking Update",
        "Mise à Jour",
        "Your tracking request status changed to {status}.",
        False,
    ),
    "tracking_evidence_requested": (
        NotificationCategory.TRACKING,
        "Documents Needed",
        "Documents Requis",
        "Authorities need more information: {message}",
        True,
    ),
}


def notify_user(*, user, event: str, context: dict = None) -> Notification:
    context = context or {}
    template = EVENT_TEMPLATES.get(event)

    if not template:
        logger.warning(
            "notify_user called with unknown event '%s' — sending generic notice.",
            event,
        )
        category, title, body, send_email = (
            NotificationCategory.SYSTEM,
            "Notification",
            "You have a new notification.",
            False,
        )
    else:
        category, title_en, title_fr, body_template, send_email = template
        # Language selection left simple here — swap for user.language_pref
        # once accounts/ exposes it.
        title = title_en
        try:
            body = body_template.format(**context)
        except (KeyError, IndexError):
            body = body_template

    notification = Notification.objects.create(
        user=user,
        category=category,
        event=event,
        title=title,
        message=body,
        related_entity_id=context.get("tracking_id") or context.get("submission_id"),
    )

    push_ok = _send_push(user, title, body, context)
    notification.push_sent = push_ok

    if send_email:
        email_ok = _send_email(user, title, body)
        notification.email_sent = email_ok

    notification.save(update_fields=["push_sent", "email_sent"])
    return notification


def _send_push(user, title: str, body: str, context: dict) -> bool:
    device_token = getattr(
        user, "fcm_token", None
    )  # ASSUMPTION: adjust field name if different
    if not device_token:
        return False
    from integrations.notifications.fcm_client import send_push_notification

    return send_push_notification(
        device_token=device_token, title=title, body=body, data=context
    )


def _send_email(user, subject: str, body: str) -> bool:
    if not getattr(user, "email", None):
        return False
    try:
        from integrations.email.client import (
            send_email,
        )  # ASSUMPTION: confirm this signature

        send_email(user.email, subject, body)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error("Email send failed for %s: %s", user.email, exc)
        return False
