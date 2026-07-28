from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "scheduled_for", "status", "doctor")
    list_filter = ("status",)
    search_fields = ("patient__patient_code", "patient__last_name")
