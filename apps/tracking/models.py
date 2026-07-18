import uuid

from django.conf import settings
from django.db import models


class TrackingCategory(models.TextChoices):
    ELECTRONIC_DEVICE = "ELECTRONIC_DEVICE", "Electronic Device"
    VEHICLE = "VEHICLE", "Vehicle"


class TrackingStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    OWNERSHIP_VERIFIED = "OWNERSHIP_VERIFIED", "Ownership Verified"
    PAYMENT_PENDING = "PAYMENT_PENDING", "Payment Pending"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED", "Payment Submitted"
    PAYMENT_APPROVED = "PAYMENT_APPROVED", "Payment Approved"
    QUEUED = "QUEUED", "Queued"
    SENT_TO_AUTHORITY = "SENT_TO_AUTHORITY", "Sent to Authority"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION", "Under Investigation"
    LOCATED = "LOCATED", "Located"
    RECOVERED = "RECOVERED", "Recovered"
    CLOSED = "CLOSED", "Closed"
    CANCELLED = "CANCELLED", "Cancelled"


# Explicit allowed transitions — the tracking equivalent of a lightweight
# workflow engine. Anything not listed here is rejected by the service layer.
ALLOWED_TRANSITIONS = {
    TrackingStatus.DRAFT: {TrackingStatus.OWNERSHIP_VERIFIED, TrackingStatus.CANCELLED},
    TrackingStatus.OWNERSHIP_VERIFIED: {
        TrackingStatus.PAYMENT_PENDING,
        TrackingStatus.CANCELLED,
    },
    TrackingStatus.PAYMENT_PENDING: {
        TrackingStatus.PAYMENT_SUBMITTED,
        TrackingStatus.CANCELLED,
    },
    TrackingStatus.PAYMENT_SUBMITTED: {
        TrackingStatus.PAYMENT_APPROVED,
        TrackingStatus.PAYMENT_PENDING,
    },
    TrackingStatus.PAYMENT_APPROVED: {TrackingStatus.QUEUED},
    TrackingStatus.QUEUED: {TrackingStatus.SENT_TO_AUTHORITY, TrackingStatus.CANCELLED},
    TrackingStatus.SENT_TO_AUTHORITY: {TrackingStatus.UNDER_INVESTIGATION},
    TrackingStatus.UNDER_INVESTIGATION: {TrackingStatus.LOCATED, TrackingStatus.CLOSED},
    TrackingStatus.LOCATED: {
        TrackingStatus.RECOVERED,
        TrackingStatus.UNDER_INVESTIGATION,
    },
    TrackingStatus.RECOVERED: {TrackingStatus.CLOSED},
    TrackingStatus.CLOSED: set(),
    TrackingStatus.CANCELLED: set(),
}


class TrackingRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    reference_code = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Human-facing ID, e.g. VRN-2026-00145. Set in save().",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tracking_requests",
    )
    category = models.CharField(max_length=20, choices=TrackingCategory.choices)
    status = models.CharField(
        max_length=25, choices=TrackingStatus.choices, default=TrackingStatus.DRAFT
    )

    description = models.TextField(
        blank=True, help_text="Circumstances of loss/theft as reported by the citizen."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Tracking Request"
        verbose_name_plural = "Tracking Requests"
        indexes = [models.Index(fields=["status"]), models.Index(fields=["user"])]

    def __str__(self):
        return f"{self.reference_code} — {self.get_category_display()} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.reference_code:
            self.reference_code = self._generate_reference_code()
        super().save(*args, **kwargs)

    def _generate_reference_code(self) -> str:
        from django.utils import timezone

        year = timezone.now().year
        seq = TrackingRequest.objects.filter(created_at__year=year).count() + 1
        return f"VRN-{year}-{seq:05d}"


class DeviceCategory(models.TextChoices):
    PHONE = "PHONE", "Phone"
    LAPTOP = "LAPTOP", "Laptop"
    TABLET = "TABLET", "Tablet"
    DESKTOP = "DESKTOP", "Desktop"
    SMART_WATCH = "SMART_WATCH", "Smart Watch"
    ROUTER = "ROUTER", "Router"
    DRONE = "DRONE", "Drone"
    CAMERA = "CAMERA", "Camera"
    GAMING_CONSOLE = "GAMING_CONSOLE", "Gaming Console"
    EXTERNAL_DRIVE = "EXTERNAL_DRIVE", "External Drive"
    OTHER = "OTHER", "Other"


class ElectronicDevice(models.Model):
    tracking_request = models.OneToOneField(
        TrackingRequest, on_delete=models.CASCADE, related_name="device_detail"
    )
    device_category = models.CharField(max_length=20, choices=DeviceCategory.choices)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    imei = models.CharField(max_length=20, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    receipt_file = models.FileField(
        upload_to="documents/tracking/devices/%Y/%m/", blank=True, null=True
    )

    class Meta:
        verbose_name = "Electronic Device"
        verbose_name_plural = "Electronic Devices"

    def __str__(self):
        return f"{self.brand} {self.model} ({self.get_device_category_display()})"


class VehicleCategory(models.TextChoices):
    CAR = "CAR", "Car"
    MOTORCYCLE = "MOTORCYCLE", "Motorcycle"
    TRUCK = "TRUCK", "Truck"
    BUS = "BUS", "Bus"
    TAXI = "TAXI", "Taxi"
    TRICYCLE = "TRICYCLE", "Tricycle"
    OTHER = "OTHER", "Other"


class Vehicle(models.Model):
    tracking_request = models.OneToOneField(
        TrackingRequest, on_delete=models.CASCADE, related_name="vehicle_detail"
    )
    vehicle_category = models.CharField(max_length=20, choices=VehicleCategory.choices)
    manufacturer = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField(null=True, blank=True)
    plate_number = models.CharField(max_length=20, blank=True)
    vin = models.CharField(max_length=50, blank=True)
    registration_file = models.FileField(
        upload_to="documents/tracking/vehicles/%Y/%m/", blank=True, null=True
    )
    insurance_file = models.FileField(
        upload_to="documents/tracking/vehicles/%Y/%m/", blank=True, null=True
    )
    ownership_document_file = models.FileField(
        upload_to="documents/tracking/vehicles/%Y/%m/", blank=True, null=True
    )

    class Meta:
        verbose_name = "Vehicle"
        verbose_name_plural = "Vehicles"

    def __str__(self):
        return f"{self.manufacturer} {self.model} ({self.plate_number})"


class OwnershipVerification(models.Model):
    """
    Distinct from KYC — KYC verifies who the user *is*; this verifies that
    the user owns the specific item being tracked. Score out of 3; 2/3
    passes, below that is auto-rejected pending manual override.
    """

    tracking_request = models.OneToOneField(
        TrackingRequest, on_delete=models.CASCADE, related_name="ownership_verification"
    )

    matched_account_name = models.BooleanField(default=False)
    matched_phone = models.BooleanField(default=False)
    matched_password = models.BooleanField(default=False)
    friend_account_used = models.BooleanField(
        default=False,
        help_text="True if verification relied on a linked/friend account.",
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ownership Verification"
        verbose_name_plural = "Ownership Verifications"

    @property
    def score(self) -> int:
        return sum(
            [
                self.matched_account_name,
                self.matched_phone,
                self.matched_password,
            ]
        )

    @property
    def passes(self) -> bool:
        return self.score >= 2

    def __str__(self):
        return f"{self.tracking_request.reference_code} — {self.score}/3"


class Agency(models.TextChoices):
    POLICE = "POLICE", "Police"
    GENDARMERIE = "GENDARMERIE", "National Gendarmerie"
    TELECOM = "TELECOM", "Telecom Operator"
    TRANSPORT_MINISTRY = "TRANSPORT_MINISTRY", "Ministry of Transport"
    INSURANCE = "INSURANCE", "Insurance"
    OTHER = "OTHER", "Other"


class AuthorityCaseStatus(models.TextChoices):
    ASSIGNED = "ASSIGNED", "Assigned"
    ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    AWAITING_DOCUMENTS = "AWAITING_DOCUMENTS", "Awaiting Documents"
    COMPLETED = "COMPLETED", "Completed"


class AuthorityCase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    tracking_request = models.ForeignKey(
        TrackingRequest, on_delete=models.CASCADE, related_name="authority_cases"
    )
    case_number = models.CharField(max_length=50, blank=True)
    agency = models.CharField(max_length=20, choices=Agency.choices)

    # Loosely coupled to a future Institution model, same pattern as
    # payments.related_object_id — avoids a hard dependency for now.
    institution_id = models.UUIDField(null=True, blank=True)
    institution_name = models.CharField(max_length=150, blank=True)

    assigned_officer = models.CharField(max_length=150, blank=True)
    assigned_date = models.DateField(null=True, blank=True)
    expected_completion = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AuthorityCaseStatus.choices,
        default=AuthorityCaseStatus.ASSIGNED,
    )
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Authority Case"
        verbose_name_plural = "Authority Cases"

    def __str__(self):
        return f"{self.tracking_request.reference_code} — {self.get_agency_display()}"


class Evidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_request = models.ForeignKey(
        TrackingRequest, on_delete=models.CASCADE, related_name="evidence_items"
    )
    file = models.FileField(upload_to="documents/tracking/evidence/%Y/%m/")
    description = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Evidence"
        verbose_name_plural = "Evidence"


class EvidenceRequestStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    FULFILLED = "FULFILLED", "Fulfilled"


class EvidenceRequest(models.Model):
    """
    Represents an authority asking for more documents. History is never
    deleted — a fulfilled request stays on record, and a new request can
    be opened if the authority needs yet more.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_request = models.ForeignKey(
        TrackingRequest, on_delete=models.CASCADE, related_name="evidence_requests"
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    message = models.TextField()
    status = models.CharField(
        max_length=15,
        choices=EvidenceRequestStatus.choices,
        default=EvidenceRequestStatus.OPEN,
    )
    fulfilled_by_evidence = models.ForeignKey(
        Evidence, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Evidence Request"
        verbose_name_plural = "Evidence Requests"


class TimelineEvent(models.Model):
    """
    Append-only history for a TrackingRequest. Every state-changing action
    across this app (and payments, via the unlock hook) should call
    services.record_timeline_event() so Flutter can render one consistent
    history view without querying five different tables.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_request = models.ForeignKey(
        TrackingRequest, on_delete=models.CASCADE, related_name="timeline_events"
    )
    event_type = models.CharField(max_length=40)
    description = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Timeline Event"
        verbose_name_plural = "Timeline Events"

    def __str__(self):
        return f"{self.tracking_request.reference_code} — {self.event_type}"
