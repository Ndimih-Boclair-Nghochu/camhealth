from rest_framework import serializers

from .models import Appointment


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
