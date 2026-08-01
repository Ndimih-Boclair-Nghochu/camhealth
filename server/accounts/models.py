import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class Branch(models.Model):
    """A hospital branch/site that staff can be assigned to."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "branches"

    def __str__(self):
        return self.name


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Administrator"
    DOCTOR = "DOCTOR", "Doctor"
    NURSE = "NURSE", "Nurse"
    RECEPTIONIST = "RECEPTIONIST", "Receptionist"
    CASHIER = "CASHIER", "Cashier"
    PHARMACIST = "PHARMACIST", "Pharmacist"
    PATIENT = "PATIENT", "Patient"


# Roles that belong to hospital staff (everything except a self-service patient).
STAFF_ROLES = [
    Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.CASHIER, Role.PHARMACIST,
]


class User(AbstractUser):
    """Staff account. Role drives what the person may see and do."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.RECEPTIONIST)
    phone = models.CharField(max_length=20, blank=True)
    # Staff created by an admin get a matricule and stay inactive until they
    # activate their account with it. Self-registered patients are activated.
    matricule = models.CharField(max_length=20, unique=True, null=True, blank=True)
    activated = models.BooleanField(default=True)
    branch = models.ForeignKey(
        Branch, null=True, blank=True, on_delete=models.SET_NULL, related_name="staff"
    )

    @property
    def is_staff_member(self):
        return self.is_superuser or self.role in STAFF_ROLES

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class AuditLog(models.Model):
    """Append-only record of who did what, and when."""

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        VIEW = "VIEW", "View"
        LOGIN = "LOGIN", "Login"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs"
    )
    action = models.CharField(max_length=10, choices=Action.choices)
    model_name = models.CharField(max_length=80, blank=True)
    object_id = models.CharField(max_length=64, blank=True)
    description = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        who = self.user or "system"
        return f"{self.timestamp:%Y-%m-%d %H:%M} {who} {self.action} {self.model_name}"
