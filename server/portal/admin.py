from django.contrib import admin

from .models import DrugOrder, DrugOrderItem, Facility, HospitalPost, StaffLocation


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "latitude", "longitude", "geofence_radius_m")


@admin.register(StaffLocation)
class StaffLocationAdmin(admin.ModelAdmin):
    list_display = ("user", "at_hospital", "updated_at")
    list_filter = ("at_hospital",)


@admin.register(HospitalPost)
class HospitalPostAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "published", "created_at")
    list_filter = ("category", "published")
    search_fields = ("title", "body")


class DrugOrderItemInline(admin.TabularInline):
    model = DrugOrderItem
    extra = 0


@admin.register(DrugOrder)
class DrugOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "status", "fulfilment", "payment_method", "created_at")
    list_filter = ("status", "fulfilment")
    inlines = [DrugOrderItemInline]
