class IncidentSeverity:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    CHOICES = [
        (LOW, "Low"),
        (MEDIUM, "Medium"),
        (HIGH, "High"),
        (CRITICAL, "Critical"),
    ]
