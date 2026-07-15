from ipaddress import ip_address

from django.dispatch import Signal

# Fired instead of importing the audit app directly, to avoid
# shared/ -> apps/ circular imports. audit/signals.py listens for this.
audit_action = Signal()  # providing_args: actor, verb, target, metadata


def log_audit_action(actor, verb: str, target, metadata: dict | None = None, ip_address: str | None = None):
    """
    Call this from any service function that performs a sensitive action
    (moderation decision, legal content edit, certificate issuance, etc).
    """
    audit_action.send(
        sender=target.__class__,
        actor=actor,
        verb=verb,
        target=target,
        metadata=metadata or {},
        ip_address=ip_address,
    )
