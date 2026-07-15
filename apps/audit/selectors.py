from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet

from .models import AuditLog


def all_logs() -> QuerySet[AuditLog]:
    return AuditLog.objects.select_related("actor", "target_content_type")


def logs_for_verb(verb_prefix: str) -> QuerySet[AuditLog]:
    """e.g. logs_for_verb('incident_report') -> all incident_report.* actions"""
    return all_logs().filter(verb__startswith=verb_prefix)


def logs_for_actor(actor) -> QuerySet[AuditLog]:
    return all_logs().filter(actor=actor)


def logs_for_target(target) -> QuerySet[AuditLog]:
    content_type = ContentType.objects.get_for_model(target.__class__)
    return all_logs().filter(
        target_content_type=content_type, target_object_id=str(target.pk)
    )


def logs_in_range(*, start=None, end=None) -> QuerySet[AuditLog]:
    qs = all_logs()
    if start:
        qs = qs.filter(created_at__gte=start)
    if end:
        qs = qs.filter(created_at__lte=end)
    return qs
