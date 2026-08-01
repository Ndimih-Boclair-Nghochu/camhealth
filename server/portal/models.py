import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models

from common.models import BaseModel


class HospitalPost(BaseModel):
    """News, campaigns and health tips the hospital publishes to patients."""

    class Category(models.TextChoices):
        NEWS = "NEWS", "News"
        CAMPAIGN = "CAMPAIGN", "Campaign"
        TIP = "TIP", "Health tip"
        ALERT = "ALERT", "Alert"

    title = models.CharField(max_length=160)
    body = models.TextField()
    category = models.CharField(max_length=10, choices=Category.choices, default=Category.NEWS)
    image_url = models.URLField(blank=True)
    published = models.BooleanField(default=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="posts",
    )

    def __str__(self):
        return self.title


class DrugOrder(BaseModel):
    """A patient's pharmacy order (the shop / e-pharmacy)."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        READY = "READY", "Ready"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class Fulfilment(models.TextChoices):
        PICKUP = "PICKUP", "Pickup"
        DELIVERY = "DELIVERY", "Delivery"

    class Method(models.TextChoices):
        CASH = "CASH", "Cash on collection"
        MOMO_MTN = "MOMO_MTN", "MTN Mobile Money"
        MOMO_ORANGE = "MOMO_ORANGE", "Orange Money"

    patient = models.ForeignKey("patients.Patient", on_delete=models.CASCADE, related_name="drug_orders")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    fulfilment = models.CharField(max_length=8, choices=Fulfilment.choices, default=Fulfilment.PICKUP)
    payment_method = models.CharField(max_length=12, choices=Method.choices, default=Method.CASH)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    note = models.CharField(max_length=255, blank=True)
    prescription_image = models.URLField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_drug_orders",
    )

    def __str__(self):
        return f"Order {str(self.id)[:8]} — {self.patient.patient_code}"

    @property
    def total(self):
        return sum((it.amount for it in self.items.all()), Decimal("0"))

    @property
    def item_count(self):
        return sum(it.quantity for it in self.items.all())


class DrugOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(DrugOrder, on_delete=models.CASCADE, related_name="items")
    drug = models.ForeignKey("pharmacy.Drug", null=True, blank=True, on_delete=models.SET_NULL, related_name="order_items")
    drug_name = models.CharField(max_length=120)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def amount(self):
        return self.unit_price * self.quantity

    def save(self, *args, **kwargs):
        if self.drug_id and (not self.drug_name or not self.unit_price):
            self.drug_name = self.drug_name or self.drug.name
            if not self.unit_price:
                self.unit_price = self.drug.price
        super().save(*args, **kwargs)
