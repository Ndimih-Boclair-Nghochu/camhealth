import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.db.models import Max

from common.models import BaseModel


class Invoice(BaseModel):
    class Status(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PARTIAL = "PARTIAL", "Partially paid"
        PAID = "PAID", "Paid"

    number = models.CharField(max_length=20, unique=True, editable=False, db_index=True)
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="invoices"
    )
    consultation = models.ForeignKey(
        "clinical.Consultation", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="invoices",
    )
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.UNPAID)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_invoices",
    )

    def __str__(self):
        return f"{self.number} — {self.patient.patient_code}"

    @property
    def total(self):
        return sum((item.amount for item in self.items.all()), Decimal("0"))

    @property
    def amount_paid(self):
        return sum((p.amount for p in self.payments.all()), Decimal("0"))

    @property
    def balance(self):
        return self.total - self.amount_paid

    def refresh_status(self, save=True):
        paid = self.amount_paid
        if paid <= 0:
            self.status = self.Status.UNPAID
        elif paid < self.total:
            self.status = self.Status.PARTIAL
        else:
            self.status = self.Status.PAID
        if save:
            super().save(update_fields=["status", "updated_at"])

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = self._next_number()
        super().save(*args, **kwargs)

    @staticmethod
    def _next_number():
        with transaction.atomic():
            last = (
                Invoice.objects.select_for_update()
                .filter(number__startswith="INV-")
                .aggregate(m=Max("number"))["m"]
            )
            seq = int(last.split("-")[1]) + 1 if last else 1
            return f"INV-{seq:06d}"


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    @property
    def amount(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.description} x{self.quantity}"


class Payment(BaseModel):
    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        MOMO_MTN = "MOMO_MTN", "MTN Mobile Money"
        MOMO_ORANGE = "MOMO_ORANGE", "Orange Money"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=12, choices=Method.choices, default=Method.CASH)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=60, blank=True, help_text="MoMo transaction ref")
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="received_payments",
    )

    def __str__(self):
        return f"{self.get_method_display()} {self.amount} on {self.invoice.number}"
