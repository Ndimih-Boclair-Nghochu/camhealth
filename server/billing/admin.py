from django.contrib import admin

from .models import Invoice, InvoiceItem, Payment


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "patient", "status", "total", "amount_paid", "balance", "created_at")
    list_filter = ("status",)
    search_fields = ("number", "patient__patient_code", "patient__last_name")
    inlines = [InvoiceItemInline, PaymentInline]
