from rest_framework import serializers

from .models import Drug, Pharmacy, StockMovement


class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ["id", "name", "address", "city", "phone", "active", "created_at"]


class DrugSerializer(serializers.ModelSerializer):
    stock_status = serializers.CharField(read_only=True)
    is_low = serializers.BooleanField(read_only=True)
    is_out = serializers.BooleanField(read_only=True)

    class Meta:
        model = Drug
        fields = [
            "id", "name", "unit", "price", "stock_quantity", "reorder_level",
            "active", "stock_status", "is_low", "is_out", "created_at",
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source="drug.name", read_only=True)
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id", "drug", "drug_name", "kind", "kind_display", "quantity",
            "reason", "prescription", "created_at",
        ]
