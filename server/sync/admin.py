from django.contrib import admin

from .models import SyncCursor, Tombstone


@admin.register(Tombstone)
class TombstoneAdmin(admin.ModelAdmin):
    list_display = ("model_label", "object_id", "deleted_at")
    list_filter = ("model_label",)


@admin.register(SyncCursor)
class SyncCursorAdmin(admin.ModelAdmin):
    list_display = ("name", "last_synced_at")
