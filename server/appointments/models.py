from django.conf import settings
from django.db import models

from common.models import BaseModel


class Appointment(BaseModel):
    class Status(models.TextChoices):
        BOOKED = "BOOKED", "Booked"
        WAITING = "WAITING", "Waiting"
        IN_CONSULTATION = "IN_CONSULTATION", "In consultation"
        DONE = "DONE", "Done"
        CANCELLED = "CANCELLED", "Cancelled"

    # Statuses that still count as "in the queue" for a given day.
    ACTIVE_STATUSES = ["BOOKED", "WAITING", "IN_CONSULTATION"]

    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="appointments"
    )
    scheduled_for = models.DateTimeField()
    reason = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.BOOKED)
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="appointments",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_appointments",
    )

    class Meta(BaseModel.Meta):
        ordering = ["scheduled_for"]

    def __str__(self):
        return f"{self.patient.patient_code} @ {self.scheduled_for:%Y-%m-%d %H:%M}"
