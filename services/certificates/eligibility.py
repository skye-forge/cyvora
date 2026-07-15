"""
Eligibility rules per tier. Kept separate from services.py so the rules
can be tuned (or made configurable per-institution later) without
touching issuance/PDF/QR generation logic.

Current rules (tunable):
  - Bronze: at least 1 completed lesson.
  - Silver: at least 3 completed lessons, spanning at least 2 zones.
  - Gold:   every active zone has at least one completed lesson,
            AND the user has submitted at least 1 incident report
            (matches the competition doc: "Gold tier" requires
            completing required zones and submitting one incident report).
"""

from apps.incidents.models import Incident
from apps.learning.models import Zone, LessonProgress
from shared.constants import CertificateTier


def _completed_progress(user):
    return LessonProgress.objects.filter(user=user, completed=True).select_related(
        "lesson__module__zone"
    )


def is_eligible_for(user, tier: str) -> bool:
    progress = _completed_progress(user)

    if tier == CertificateTier.BRONZE:
        return progress.count() >= 1

    if tier == CertificateTier.SILVER:
        zones_touched = {p.lesson.module.zone_id for p in progress}
        return progress.count() >= 3 and len(zones_touched) >= 2

    if tier == CertificateTier.GOLD:
        active_zone_ids = set(
            Zone.objects.filter(status="published").values_list("id", flat=True)
        )
        completed_zone_ids = {p.lesson.module.zone_id for p in progress}
        zones_covered = bool(active_zone_ids) and active_zone_ids.issubset(completed_zone_ids)
        has_incident_report = Incident.objects.filter(reporter=user).exists()
        return zones_covered and has_incident_report

    return False
