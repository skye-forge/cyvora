class Roles:
    CITIZEN = "citizen"
    MODERATOR = "moderator"
    LEGAL_EDITOR = "legal_editor"
    INSTITUTION_ADMIN = "institution_admin"
    NATIONAL_PUBLISHER = "national_publisher"
    SYSTEM_ADMIN = "system_admin"

    CHOICES = [
        (CITIZEN, "Citizen"),
        (MODERATOR, "Moderator"),
        (LEGAL_EDITOR, "Legal Editor"),
        (INSTITUTION_ADMIN, "Institution Admin"),
        (NATIONAL_PUBLISHER, "National Publisher"),
        (SYSTEM_ADMIN, "System Admin"),
    ]
