from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response

from common.api import AuditModelViewSet

from .models import Consultation, Prescription
from .serializers import ConsultationSerializer, PrescriptionSerializer


class ConsultationViewSet(AuditModelViewSet):
    queryset = Consultation.objects.select_related("patient", "doctor").all()
    serializer_class = ConsultationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["patient__patient_code", "patient__first_name", "patient__last_name", "diagnosis"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get("patient")
        if patient:
            qs = qs.filter(patient_id=patient)
        return qs

    def perform_create(self, serializer):
        # Default the doctor to the acting user when they are a clinician.
        extra = {}
        if getattr(self.request.user, "role", None) in ("DOCTOR", "NURSE"):
            extra["doctor"] = self.request.user
        instance = serializer.save(created_by=self.request.user, **extra)
        from common.api import write_audit
        write_audit(self.request, "CREATE", instance)


class PrescriptionViewSet(AuditModelViewSet):
    queryset = Prescription.objects.select_related("patient", "prescriber").prefetch_related("items")
    serializer_class = PrescriptionSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get("patient")
        pharmacy = self.request.query_params.get("pharmacy")
        if patient:
            qs = qs.filter(patient_id=patient)
        if pharmacy:
            qs = qs.filter(pharmacy_id=pharmacy)
        return qs

    def perform_create(self, serializer):
        extra = {"created_by": self.request.user}
        if not serializer.validated_data.get("prescriber") and getattr(self.request.user, "role", None) == "DOCTOR":
            extra["prescriber"] = self.request.user
        instance = serializer.save(**extra)
        from common.api import write_audit
        write_audit(self.request, "CREATE", instance)

    @action(detail=False, methods=["get"])
    def queue(self, request):
        """Pharmacist work list: prescriptions to prepare / hand over."""
        qs = self.get_queryset().filter(
            fulfilment_status__in=[Prescription.Fulfilment.PENDING, Prescription.Fulfilment.READY]
        ).order_by("created_at")
        return Response(PrescriptionSerializer(qs, many=True).data)
