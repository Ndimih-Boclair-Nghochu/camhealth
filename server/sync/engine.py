"""Core sync logic: serialize rows, apply incoming rows (last-write-wins),
and compute what has changed since a given time.

Conflict policy (Phase 1): last-write-wins by ``updated_at``. An incoming row is
applied unless the local copy is strictly newer. Applying a row whose values are
already identical is a no-op, which prevents pull/push ping-pong in steady state.

Note: the receiver's ``updated_at`` is refreshed on save (auto_now), so ordering
uses receive-time on mirrored nodes. This is appropriate for the facility→cloud
backup model; a full CRDT/PowerSync layer is the future upgrade for heavy
multi-writer scenarios.
"""
import datetime
import decimal
import uuid

from django.utils.dateparse import parse_datetime

from .registry import LABEL_TO_MODEL, SYNCABLE

_SKIP_FIELDS = {"created_at", "updated_at"}


def _jsonable(value):
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, decimal.Decimal):
        return str(value)
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    return value


def serialize_instance(obj):
    """Flat dict of every concrete column (FKs appear as ``<name>_id``)."""
    return {f.attname: _jsonable(getattr(obj, f.attname)) for f in obj._meta.concrete_fields}


def _values_match(obj, data):
    for f in obj._meta.concrete_fields:
        if f.attname in _SKIP_FIELDS:
            continue
        if _jsonable(getattr(obj, f.attname)) != data.get(f.attname):
            return False
    return True


def apply_record(model, data):
    """Upsert one row. Returns 'created' | 'updated' | 'unchanged' | 'skipped-older'."""
    pk = data.get("id")
    existing = model.objects.filter(pk=pk).first()

    if existing is not None:
        local = getattr(existing, "updated_at", None)
        incoming = data.get("updated_at")
        if local and incoming and local.isoformat() > incoming:
            return "skipped-older"
        if _values_match(existing, data):
            return "unchanged"

    obj = existing or model()
    for f in model._meta.concrete_fields:
        if f.attname in _SKIP_FIELDS:
            continue
        if f.attname in data:
            setattr(obj, f.attname, data[f.attname])
    obj.save()
    return "updated" if existing is not None else "created"


def collect_changes(since):
    """All syncable rows changed after ``since`` (ISO string or None)."""
    since_dt = parse_datetime(since) if since else None
    changes = {}
    for label, model in SYNCABLE:
        qs = model.objects.all()
        if since_dt is not None:
            qs = qs.filter(updated_at__gt=since_dt)
        rows = [serialize_instance(obj) for obj in qs]
        if rows:
            changes[label] = rows
    return changes


def collect_deletions(since):
    from .models import Tombstone

    since_dt = parse_datetime(since) if since else None
    qs = Tombstone.objects.all()
    if since_dt is not None:
        qs = qs.filter(deleted_at__gt=since_dt)
    return [{"model": t.model_label, "id": str(t.object_id)} for t in qs]


def apply_batch(payload):
    """Apply a pull/push payload of {changes, deletions}. Returns a summary."""
    summary = {"created": 0, "updated": 0, "skipped": 0, "deleted": 0}
    changes = payload.get("changes", {}) or {}
    for label, model in SYNCABLE:  # parents before children
        for row in changes.get(label, []):
            outcome = apply_record(model, row)
            if outcome == "created":
                summary["created"] += 1
            elif outcome == "updated":
                summary["updated"] += 1
            else:
                summary["skipped"] += 1

    for deletion in payload.get("deletions", []) or []:
        model = LABEL_TO_MODEL.get(deletion.get("model"))
        if not model:
            continue
        deleted, _ = model.objects.filter(pk=deletion.get("id")).delete()
        if deleted:
            summary["deleted"] += 1
    return summary
