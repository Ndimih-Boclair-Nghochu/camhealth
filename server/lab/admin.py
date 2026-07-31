from django.contrib import admin

from .models import LabOrder, LabResult, LabTest


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "sample_type", "active")
    search_fields = ("name",)


class LabResultInline(admin.TabularInline):
    model = LabResult
    extra = 0


@admin.register(LabOrder)
class LabOrderAdmin(admin.ModelAdmin):
    list_display = ("patient", "status", "ordered_by", "created_at")
    list_filter = ("status",)
    search_fields = ("patient__patient_code", "patient__last_name")
    inlines = [LabResultInline]
