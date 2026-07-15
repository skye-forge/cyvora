class InstitutionType:
    SCHOOL = "school"
    BANK = "bank"
    NGO = "ngo"
    GOVERNMENT = "government"
    CORPORATE = "corporate"

    CHOICES = [
        (SCHOOL, "School"),
        (BANK, "Bank"),
        (NGO, "NGO"),
        (GOVERNMENT, "Government"),
        (CORPORATE, "Corporate"),
    ]


class LicenseTier:
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"

    CHOICES = [
        (BASIC, "Basic"),
        (STANDARD, "Standard"),
        (PREMIUM, "Premium"),
    ]


class InstitutionMemberRole:
    ADMIN = "admin"
    MEMBER = "member"

    CHOICES = [
        (ADMIN, "Admin"),
        (MEMBER, "Member"),
    ]
