from django.contrib import admin

from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("patient_code", "full_name", "sex", "age", "phone", "created_at")
    search_fields = ("patient_code", "first_name", "last_name", "phone")
    list_filter = ("sex", "blood_group")
    readonly_fields = ("patient_code", "qr_payload")
