from decimal import Decimal

from django.conf import settings
from django.db import models

from common.models import BaseModel


class LabTest(BaseModel):
    """Catalogue of tests the laboratory can perform."""

    name = models.CharField(max_length=120, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    sample_type = models.CharField(max_length=60, blank=True, help_text="blood, urine…")
    normal_range = models.CharField(max_length=120, blank=True)
    active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class LabOrder(BaseModel):
    class Status(models.TextChoices):
        ORDERED = "ORDERED", "Ordered"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    PENDING_STATUSES = ["ORDERED", "IN_PROGRESS"]

    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="lab_orders"
    )
    consultation = models.ForeignKey(
        "clinical.Consultation", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="lab_orders",
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ORDERED)
    notes = models.CharField(max_length=255, blank=True)
    ordered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="ordered_lab_orders",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_lab_orders",
    )

    def __str__(self):
        return f"Lab order {self.patient.patient_code} ({self.get_status_display()})"

    def refresh_status(self, save=True):
        """Derive status from how many results have been entered."""
        if self.status == self.Status.CANCELLED:
            return
        items = list(self.items.all())
        if items and all(i.result_value for i in items):
            self.status = self.Status.COMPLETED
        elif any(i.result_value for i in items):
            self.status = self.Status.IN_PROGRESS
        else:
            self.status = self.Status.ORDERED
        if save:
            super().save(update_fields=["status", "updated_at"])


class LabResult(BaseModel):
    class Flag(models.TextChoices):
        PENDING = "PENDING", "Pending"
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        LOW = "LOW", "Low"
        ABNORMAL = "ABNORMAL", "Abnormal"

    order = models.ForeignKey(LabOrder, on_delete=models.CASCADE, related_name="items")
    test = models.ForeignKey(
        LabTest, null=True, blank=True, on_delete=models.SET_NULL, related_name="results"
    )
    test_name = models.CharField(max_length=120)
    result_value = models.CharField(max_length=120, blank=True)
    unit = models.CharField(max_length=30, blank=True)
    normal_range = models.CharField(max_length=120, blank=True)
    flag = models.CharField(max_length=8, choices=Flag.choices, default=Flag.PENDING)
    remarks = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.test_name}: {self.result_value or '—'}"

    def save(self, *args, **kwargs):
        if not self.test_name and self.test_id:
            self.test_name = self.test.name
        super().save(*args, **kwargs)
