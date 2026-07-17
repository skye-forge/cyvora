class IncidentCategory:
    PHISHING = "phishing"
    SCAM_CALL = "scam_call"
    FAKE_SITE = "fake_site"
    PHYSICAL_DISTURBANCE = "physical_disturbance"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    SERVICE_OUTAGE = "service_outage"
    OTHER = "other"

    CHOICES = [
        (PHISHING, "Phishing"),
        (SCAM_CALL, "Scam Call"),
        (FAKE_SITE, "Fake Site"),
        (PHYSICAL_DISTURBANCE, "Physical Disturbance"),
        (SUSPICIOUS_ACTIVITY, "Suspicious Activity"),
        (SERVICE_OUTAGE, "Service Outage"),
        (OTHER, "Other"),
    ]
