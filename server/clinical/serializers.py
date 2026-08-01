from rest_framework import serializers

from .models import Consultation, Prescription, PrescriptionItem


class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Consultation
        fields = [
            "id", "patient", "patient_name", "patient_code", "doctor", "doctor_name",
            "complaint", "diagnosis", "notes",
            "temperature", "blood_pressure", "pulse", "weight",
            "status", "created_at",
        ]

    def get_doctor_name(self, obj):
        if not obj.doctor:
            return ""
        return obj.doctor.get_full_name() or obj.doctor.username


class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = ["id", "drug_name", "dosage", "frequency", "duration", "instructions"]
        read_only_fields = ["id"]


class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)
    pharmacy_name = serializers.CharField(source="pharmacy.name", read_only=True)
    pharmacy_address = serializers.CharField(source="pharmacy.address", read_only=True)
    pharmacy_phone = serializers.CharField(source="pharmacy.phone", read_only=True)
    fulfilment_display = serializers.CharField(source="get_fulfilment_status_display", read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "id", "consultation", "patient", "patient_name", "patient_code",
            "prescriber", "notes", "items", "pharmacy", "pharmacy_name",
            "pharmacy_address", "pharmacy_phone", "fulfilment_status",
            "fulfilment_display", "created_at",
        ]

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        prescription = Prescription.objects.create(**validated_data)
        for item in items:
            PrescriptionItem.objects.create(prescription=prescription, **item)
        return prescription

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            for item in items:
                PrescriptionItem.objects.create(prescription=instance, **item)
        return instance
