from django.contrib import admin

from .models import DrugOrder, DrugOrderItem, HospitalPost


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
