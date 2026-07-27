from rest_framework import filters

from common.api import AuditModelViewSet

from .models import Patient
from .serializers import PatientSerializer


class PatientViewSet(AuditModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["patient_code", "first_name", "last_name", "phone"]
    ordering_fields = ["created_at", "last_name"]
