from django.contrib import admin

from .models import Consultation, Prescription, PrescriptionItem


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 0


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("patient__patient_code", "patient__last_name", "diagnosis")


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("patient", "prescriber", "created_at")
    search_fields = ("patient__patient_code", "patient__last_name")
    inlines = [PrescriptionItemInline]
