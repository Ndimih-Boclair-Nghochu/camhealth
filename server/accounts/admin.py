from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AuditLog, Branch, User


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "phone", "active")
    search_fields = ("name", "city")


@admin.register(User)
class CamHealthUserAdmin(UserAdmin):
    list_display = ("username", "first_name", "last_name", "role", "matricule", "activated", "is_active")
    list_filter = ("role", "activated", "is_active", "branch")
    fieldsets = UserAdmin.fieldsets + (
        ("CamHealth", {"fields": ("role", "phone", "branch", "matricule", "activated")}),
    )
    readonly_fields = ("matricule",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "model_name", "object_id", "ip_address")
    list_filter = ("action", "model_name")
    search_fields = ("description", "object_id")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False
