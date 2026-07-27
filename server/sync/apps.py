from django.apps import AppConfig


class SyncConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sync"

    def ready(self):
        # Connect post_delete handlers that record tombstones for syncable models.
        from . import signals

        signals.register()
