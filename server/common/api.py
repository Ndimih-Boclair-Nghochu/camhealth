"""Shared API helpers, including a viewset that writes an audit trail.

Every create/update/delete performed through an ``AuditModelViewSet`` is recorded
in ``accounts.AuditLog`` with the responsible user, time and client IP. This is
both a security control and the "staff accountability" feature CamHealth promises.
"""
from rest_framework import viewsets

from .permissions import IsStaff


def client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def write_audit(request, action, instance, description=""):
    # Imported lazily to avoid a circular import at app-loading time.
    from accounts.models import AuditLog

    AuditLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(getattr(instance, "pk", "")),
        description=description or str(instance),
        ip_address=client_ip(request),
    )


class AuditModelViewSet(viewsets.ModelViewSet):
    """ModelViewSet that stamps ``created_by`` and records an audit log entry.

    All clinical/operational endpoints are staff-only; patients use the
    dedicated portal endpoints instead.
    """

    permission_classes = [IsStaff]

    def perform_create(self, serializer):
        kwargs = {}
        model = serializer.Meta.model
        if _has_field(model, "created_by"):
            kwargs["created_by"] = self.request.user
        instance = serializer.save(**kwargs)
        write_audit(self.request, "CREATE", instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        write_audit(self.request, "UPDATE", instance)

    def perform_destroy(self, instance):
        write_audit(self.request, "DELETE", instance)
        instance.delete()


def _has_field(model, field_name):
    return any(f.name == field_name for f in model._meta.get_fields())
