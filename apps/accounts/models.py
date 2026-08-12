from django.contrib.auth.models import AbstractUser
from django.db import models

from shared.constants import Languages, Roles
from shared.validators import validate_cameroon_phone
import uuid
from django.conf import settings
from django.utils import timezone

from .managers import UserManager


class User(AbstractUser):
    """
    Core domain User. Replaces Django's default username-based auth
    with email/phone login and adds the gamification + role fields
    used across the Learning, Incidents, and Certificates apps.
    """

    username = None
    first_name = None
    last_name = None

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=20, unique=True, null=True, blank=True,
        validators=[validate_cameroon_phone],
    )
    language = models.CharField(max_length=2, choices=Languages.CHOICES, default=Languages.FR)
    role = models.CharField(max_length=20, choices=Roles.CHOICES, default=Roles.CITIZEN)

    xp_points = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    streak_count = models.PositiveIntegerField(default=0)

    # institution = models.ForeignKey("institutions.Institution", on_delete=models.SET_NULL,
    #     null=True, blank=True, related_name="members")
    # ^ wired up once apps.institutions lands in Sprint 4.

    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"

    def calculate_level(self) -> int:
        """XP thresholds: every 500 XP = 1 level. Extracted here as a
        pure domain method; the XP-award workflow itself lives in
        services/learning/xp.py (Sprint 2)."""
        return max(1, (self.xp_points // 500) + 1)

    def award_xp(self, amount: int) -> None:
        self.xp_points += amount
        self.level = self.calculate_level()
        self.save(update_fields=["xp_points", "level"])


class AccountOTP(models.Model):
    class Purpose(models.TextChoices):
        REGISTER = "register", "Register"
        LOGIN = "login", "Login"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otps"
    )
    purpose = models.CharField(max_length=16, choices=Purpose.choices)
    channel = models.CharField(
        max_length=8, default="email"
    )  # "phone" unused until an SMS gateway exists
    code_hash = models.CharField(max_length=128)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def is_consumed(self):
        return self.consumed_at is not None
