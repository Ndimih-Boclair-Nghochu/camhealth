from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.api import AuditModelViewSet, write_audit
from common.permissions import IsStaffOrReadOnly

from .models import Appointment, AvailabilitySlot
from .serializers import AppointmentSerializer, AvailabilitySlotSerializer


class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    """Staff open the timetable; patients read the open slots to book."""

    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        from django.db.models import F

        qs = AvailabilitySlot.objects.select_related("doctor").all()
        if not getattr(self.request.user, "is_staff_member", False):
            # Patients only see slots that are still open to book.
            qs = qs.filter(active=True, starts_at__gt=timezone.now(), booked_count__lt=F("capacity"))
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        write_audit(self.request, "CREATE", instance)


class AppointmentViewSet(AuditModelViewSet):
    queryset = Appointment.objects.select_related("patient", "doctor").all()
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get("patient")
        status = self.request.query_params.get("status")
        if patient:
            qs = qs.filter(patient_id=patient)
        if status:
            qs = qs.filter(status=status)
        return qs

    @action(detail=False, methods=["get"])
    def queue(self, request):
        """Today's active appointments, in scheduled order — the live queue."""
        today = timezone.localdate()
        qs = (
            self.get_queryset()
            .filter(scheduled_for__date=today, status__in=Appointment.ACTIVE_STATUSES)
            .order_by("scheduled_for")
        )
        return Response(AppointmentSerializer(qs, many=True).data)

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        from common.api import write_audit

        write_audit(self.request, "CREATE", instance)
