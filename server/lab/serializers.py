from rest_framework import serializers

from .models import LabOrder, LabResult, LabTest


class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = ["id", "name", "price", "sample_type", "normal_range", "active"]


class LabResultSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    flag_display = serializers.CharField(source="get_flag_display", read_only=True)

    class Meta:
        model = LabResult
        fields = [
            "id", "test", "test_name", "result_value", "unit",
            "normal_range", "flag", "flag_display",
        ]


class LabOrderSerializer(serializers.ModelSerializer):
    items = LabResultSerializer(many=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = LabOrder
        fields = [
            "id", "patient", "patient_name", "patient_code", "consultation",
            "status", "status_display", "notes", "ordered_by", "items", "created_at",
        ]
        read_only_fields = ["status"]

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        order = LabOrder.objects.create(**validated_data)
        for item in items:
            item.pop("id", None)
            LabResult.objects.create(order=order, **item)
        order.refresh_status()
        return order

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items is not None:
            existing = {str(i.id): i for i in instance.items.all()}
            keep = set()
            for item in items:
                iid = str(item.get("id")) if item.get("id") else None
                if iid and iid in existing:
                    obj = existing[iid]
                    for attr, value in item.items():
                        if attr != "id":
                            setattr(obj, attr, value)
                    obj.save()
                    keep.add(iid)
                else:
                    item.pop("id", None)
                    obj = LabResult.objects.create(order=instance, **item)
                    keep.add(str(obj.id))
            for iid, obj in existing.items():
                if iid not in keep:
                    obj.delete()
        instance.refresh_status()
        return instance
