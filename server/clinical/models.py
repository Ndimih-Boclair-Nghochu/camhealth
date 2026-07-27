import uuid

from django.conf import settings
from django.db import models

from common.models import BaseModel


class Consultation(BaseModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"

    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="consultations"
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="consultations",
    )
    complaint = models.TextField(help_text="Presenting complaint / reason for visit")
    diagnosis = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # Vitals (kept simple as free text so nurses can record quickly)
    temperature = models.CharField(max_length=10, blank=True)
    blood_pressure = models.CharField(max_length=15, blank=True)
    pulse = models.CharField(max_length=10, blank=True)
    weight = models.CharField(max_length=10, blank=True)

    status = models.CharField(max_length=8, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_consultations",
    )

    def __str__(self):
        return f"Consultation {self.patient.patient_code} @ {self.created_at:%Y-%m-%d}"


class Prescription(BaseModel):
    consultation = models.ForeignKey(
        Consultation, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="prescriptions",
    )
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="prescriptions"
    )
    prescriber = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="prescriptions",
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_prescriptions",
    )

    def __str__(self):
        return f"Prescription for {self.patient.patient_code}"


class PrescriptionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(
        Prescription, on_delete=models.CASCADE, related_name="items"
    )
    drug_name = models.CharField(max_length=120)
    dosage = models.CharField(max_length=60, blank=True)
    frequency = models.CharField(max_length=60, blank=True)
    duration = models.CharField(max_length=60, blank=True)
    instructions = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.drug_name} {self.dosage}".strip()
