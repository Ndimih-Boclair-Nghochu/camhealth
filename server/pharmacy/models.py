from decimal import Decimal

from django.conf import settings
from django.db import models

from common.models import BaseModel


class Pharmacy(BaseModel):
    """A pharmacy branch a prescription can be routed to for collection."""

    name = models.CharField(max_length=120)
    address = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]
        verbose_name_plural = "pharmacies"

    def __str__(self):
        return self.name


class Drug(BaseModel):
    """A medicine in the pharmacy catalogue, with live stock."""

    name = models.CharField(max_length=120, unique=True)
    unit = models.CharField(max_length=30, blank=True, help_text="tablet, bottle, vial…")
    price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    stock_quantity = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10, help_text="Alert when stock reaches this")
    active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.stock_quantity})"

    @property
    def is_out(self):
        return self.stock_quantity <= 0

    @property
    def is_low(self):
        return 0 < self.stock_quantity <= self.reorder_level

    @property
    def stock_status(self):
        if self.is_out:
            return "OUT"
        if self.is_low:
            return "LOW"
        return "OK"


class StockMovement(BaseModel):
    """A change to a drug's stock. Creating one adjusts the drug's quantity."""

    class Kind(models.TextChoices):
        IN = "IN", "Restock"
        OUT = "OUT", "Dispensed"
        ADJUST = "ADJUST", "Adjustment"

    drug = models.ForeignKey(Drug, on_delete=models.CASCADE, related_name="movements")
    kind = models.CharField(max_length=6, choices=Kind.choices)
    quantity = models.IntegerField(help_text="Positive number of units moved")
    reason = models.CharField(max_length=200, blank=True)
    prescription = models.ForeignKey(
        "clinical.Prescription", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="dispensed_movements",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="stock_movements",
    )

    def __str__(self):
        return f"{self.get_kind_display()} {self.quantity} × {self.drug.name}"

    @property
    def signed_quantity(self):
        if self.kind == self.Kind.IN:
            return abs(self.quantity)
        if self.kind == self.Kind.OUT:
            return -abs(self.quantity)
        return self.quantity  # ADJUST carries a signed delta
