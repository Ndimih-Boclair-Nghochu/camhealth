from datetime import date

from django.conf import settings
from django.db import models, transaction
from django.db.models import Max

from common.models import BaseModel


class Patient(BaseModel):
    class Sex(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"

    patient_code = models.CharField(max_length=20, unique=True, editable=False, db_index=True)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    sex = models.CharField(max_length=1, choices=Sex.choices)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="registered_patients",
    )

    class Meta(BaseModel.Meta):
        indexes = [models.Index(fields=["last_name", "first_name"])]

    def __str__(self):
        return f"{self.patient_code} — {self.full_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    @property
    def qr_payload(self):
        """String encoded into the patient's QR-code card."""
        return f"CAMHEALTH:{self.patient_code}"

    def save(self, *args, **kwargs):
        if not self.patient_code:
            self.patient_code = self._next_code()
        super().save(*args, **kwargs)

    @staticmethod
    def _next_code():
        with transaction.atomic():
            last = (
                Patient.objects.select_for_update()
                .filter(patient_code__startswith="CH-")
                .aggregate(m=Max("patient_code"))["m"]
            )
            seq = int(last.split("-")[1]) + 1 if last else 1
            return f"CH-{seq:06d}"
