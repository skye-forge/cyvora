class CommunityPostType:
    ALERT = "alert"  # system-generated from an approved IncidentReport (FR-MOD-03)
    TIP = "tip"  # user-submitted (FR-COM-03)

    CHOICES = [
        (ALERT, "Alert"),
        (TIP, "Tip"),
    ]


class ModerationStatus:
    PENDING = "pending"  # awaiting automated screening
    AUTO_APPROVED = "auto_approved"  # passed automated screening, visible
    FLAGGED = "flagged"  # automated screening escalated to human (FR-COM-04)
    APPROVED = "approved"  # human moderator approved after flag
    REJECTED = "rejected"  # human moderator rejected

    CHOICES = [
        (PENDING, "Pending"),
        (AUTO_APPROVED, "Auto-Approved"),
        (FLAGGED, "Flagged for Review"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]

    VISIBLE_STATUSES = [AUTO_APPROVED, APPROVED]
