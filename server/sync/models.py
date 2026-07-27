import uuid

from django.db import models


class Tombstone(models.Model):
    """Records a deletion so peers can remove the row on their side.

    Written by a post_delete signal on every syncable model (see signals.py).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model_label = models.CharField(max_length=80)
    object_id = models.UUIDField()
    deleted_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["deleted_at"]
        indexes = [models.Index(fields=["model_label", "object_id"])]

    def __str__(self):
        return f"deleted {self.model_label}:{self.object_id}"


class SyncCursor(models.Model):
    """Tracks the last successful sync time against a named peer (e.g. 'cloud')."""

    name = models.CharField(max_length=40, unique=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} @ {self.last_synced_at:%Y-%m-%d %H:%M}" if self.last_synced_at else self.name
