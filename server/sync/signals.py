"""Record a Tombstone whenever a syncable row is deleted, so peers can mirror
the deletion. Connected from SyncConfig.ready().
"""
from django.db.models.signals import post_delete

from .registry import MODEL_TO_LABEL, SYNCABLE

# Guard so a deletion applied *by* a sync push does not itself generate a
# tombstone that would echo back to the sender.
_suppressed = set()


def suppress_for(model):
    _suppressed.add(model)


def resume_for(model):
    _suppressed.discard(model)


def _on_delete(sender, instance, **kwargs):
    if sender in _suppressed:
        return
    from .models import Tombstone

    Tombstone.objects.create(model_label=MODEL_TO_LABEL[sender], object_id=instance.pk)


def register():
    for label, model in SYNCABLE:
        post_delete.connect(_on_delete, sender=model, dispatch_uid=f"tombstone_{label}")
