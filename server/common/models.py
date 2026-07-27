import uuid

from django.db import models


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
