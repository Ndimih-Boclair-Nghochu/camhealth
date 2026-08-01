from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    qr_payload = serializers.CharField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "patient_code", "first_name", "last_name", "full_name",
            "sex", "date_of_birth", "age", "phone", "address", "blood_group",
            "allergies", "chronic_conditions", "qr_payload",
            "activation_code", "account", "created_at",
        ]
        read_only_fields = ["patient_code", "activation_code", "account", "created_at"]
