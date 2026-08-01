from rest_framework import serializers

from .models import DrugOrder, DrugOrderItem, Facility, HospitalPost, StaffLocation


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ["id", "name", "address", "latitude", "longitude", "geofence_radius_m"]


class OnSiteStaffSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    role = serializers.CharField(source="user.get_role_display", read_only=True)

    class Meta:
        model = StaffLocation
        fields = ["name", "role", "latitude", "longitude", "updated_at"]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class HospitalPostSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = HospitalPost
        fields = [
            "id", "title", "body", "category", "category_display",
            "image_url", "published", "author_name", "created_at",
        ]

    def get_author_name(self, obj):
        if not obj.author:
            return "CamHealth"
        return obj.author.get_full_name() or obj.author.username


class DrugOrderItemSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = DrugOrderItem
        fields = ["id", "drug", "drug_name", "unit_price", "quantity", "amount"]
        read_only_fields = ["id"]


class DrugOrderSerializer(serializers.ModelSerializer):
    items = DrugOrderItemSerializer(many=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = DrugOrder
        fields = [
            "id", "patient", "patient_name", "status", "status_display", "fulfilment",
            "payment_method", "address", "phone", "note", "prescription_image",
            "items", "total", "item_count", "created_at",
        ]
        read_only_fields = ["patient", "status"]

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        order = DrugOrder.objects.create(**validated_data)
        for item in items:
            item.pop("id", None)
            DrugOrderItem.objects.create(order=order, **item)
        return order
