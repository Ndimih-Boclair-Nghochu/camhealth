from rest_framework import serializers

from .models import Appointment, AvailabilitySlot


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    is_open = serializers.BooleanField(read_only=True)
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = AvailabilitySlot
        fields = [
            "id", "starts_at", "duration_minutes", "capacity", "booked_count",
            "doctor", "doctor_name", "active", "is_open",
        ]
        read_only_fields = ["booked_count"]

    def get_doctor_name(self, obj):
        if not obj.doctor:
            return ""
        return obj.doctor.get_full_name() or obj.doctor.username


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_name", "patient_code", "scheduled_for",
            "reason", "status", "status_display", "doctor", "created_at",
        ]
