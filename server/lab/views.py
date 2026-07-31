from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response

from common.api import AuditModelViewSet, write_audit

from .models import LabOrder, LabTest
from .serializers import LabOrderSerializer, LabTestSerializer


class LabTestViewSet(AuditModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class LabOrderViewSet(AuditModelViewSet):
    queryset = LabOrder.objects.select_related("patient").prefetch_related("items")
    serializer_class = LabOrderSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get("patient")
        return qs.filter(patient_id=patient) if patient else qs

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Orders still awaiting collection/results — the lab work list."""
        qs = self.get_queryset().filter(status__in=LabOrder.PENDING_STATUSES).order_by("created_at")
        return Response(LabOrderSerializer(qs, many=True).data)

    def perform_create(self, serializer):
        extra = {"created_by": self.request.user}
        if not serializer.validated_data.get("ordered_by"):
            extra["ordered_by"] = self.request.user
        instance = serializer.save(**extra)
        write_audit(self.request, "CREATE", instance)
