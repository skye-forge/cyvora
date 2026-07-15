from django.contrib.contenttypes.models import ContentType

from shared.mixins.audit_loggable import audit_action


def handle_audit_action(
    sender, actor, verb, target, metadata, ip_address=None, **kwargs
):
    """
    Listens for the audit_action signal fired anywhere in the codebase
    via shared.mixins.audit_loggable.log_audit_action(), and persists
    it as an AuditLog row.

    Deliberately defensive: an audit-logging failure must never bubble up
    and break the calling service (e.g. a moderation decision should still
    succeed even if, somehow, writing the log row fails).
    """
    from .models import AuditLog

    try:
        AuditLog.objects.create(
            actor=actor if getattr(actor, "pk", None) else None,
            actor_label=_label_for(actor),
            verb=verb,
            target_content_type=(
                ContentType.objects.get_for_model(target.__class__) if target else None
            ),
            target_object_id=str(target.pk) if target else None,
            target_repr=str(target) if target else "",
            metadata=metadata or {},
            ip_address=ip_address,
        )
    except Exception:
        import logging

        logging.getLogger("audit").exception(
            "Failed to persist AuditLog for verb=%s", verb
        )


def _label_for(actor) -> str:
    if not actor:
        return "system"
    return getattr(actor, "email", None) or getattr(actor, "phone", None) or str(actor)


audit_action.connect(handle_audit_action, dispatch_uid="audit.handle_audit_action")
