from rest_framework import filters

from common.api import AuditModelViewSet, write_audit

from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer


class InvoiceViewSet(AuditModelViewSet):
    queryset = Invoice.objects.select_related("patient").prefetch_related("items", "payments")
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["number", "patient__patient_code", "patient__last_name"]
    ordering_fields = ["created_at", "status"]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get("patient")
        status = self.request.query_params.get("status")
        if patient:
            qs = qs.filter(patient_id=patient)
        if status:
            qs = qs.filter(status=status)
        return qs


class PaymentViewSet(AuditModelViewSet):
    queryset = Payment.objects.select_related("invoice").all()
    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        payment = serializer.save(received_by=self.request.user)
        payment.invoice.refresh_status()
        write_audit(self.request, "CREATE", payment)
