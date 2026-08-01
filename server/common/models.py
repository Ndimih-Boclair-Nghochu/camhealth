import secrets
import uuid

from django.db import models

# Unambiguous alphabet (no 0/O/1/I) for human-typed activation codes.
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_code(model, field, prefix, length=6):
    """A short, unique, human-friendly code like ``STF-7KQ4PZ``."""
    while True:
        code = f"{prefix}-{''.join(secrets.choice(_CODE_ALPHABET) for _ in range(length))}"
        if not model._default_manager.filter(**{field: code}).exists():
            return code


class BaseModel(models.Model):
    """Abstract base with a UUID primary key and timestamps.

    UUID keys are deliberate: they let records created offline on different
    machines merge into the cloud without primary-key collisions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]
