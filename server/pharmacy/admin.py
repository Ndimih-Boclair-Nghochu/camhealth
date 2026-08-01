from django.contrib import admin

from .models import Drug, Pharmacy, StockMovement


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "phone", "active")
    search_fields = ("name", "city")


@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ("name", "stock_quantity", "reorder_level", "stock_status", "price", "active")
    list_filter = ("active",)
    search_fields = ("name",)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("drug", "kind", "quantity", "created_by", "created_at")
    list_filter = ("kind",)
    search_fields = ("drug__name",)
