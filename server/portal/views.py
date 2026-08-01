from rest_framework import generics, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from billing.serializers import InvoiceSerializer
from clinical.serializers import ConsultationSerializer, PrescriptionSerializer
from common.permissions import IsStaffOrReadOnly
from lab.serializers import LabOrderSerializer
from patients.models import Patient
from patients.serializers import PatientSerializer
from pharmacy.models import Drug
from pharmacy.serializers import DrugSerializer

from .models import DrugOrder, HospitalPost
from .serializers import DrugOrderSerializer, HospitalPostSerializer


def patient_profile(request):
    profile = getattr(request.user, "patient_profile", None)
    if profile is None:
        raise NotFound("No patient profile is linked to this account.")
    return profile


class MeProfileView(generics.RetrieveUpdateAPIView):
    """The signed-in patient's own health profile."""

    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return patient_profile(self.request)


class MeRecordsView(APIView):
    """Everything on the patient's file, in one call for the app."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        p = patient_profile(request)
        return Response(
            {
                "patient": PatientSerializer(p).data,
                "consultations": ConsultationSerializer(p.consultations.all(), many=True).data,
                "prescriptions": PrescriptionSerializer(p.prescriptions.all(), many=True).data,
                "lab_orders": LabOrderSerializer(p.lab_orders.all(), many=True).data,
                "invoices": InvoiceSerializer(p.invoices.all(), many=True).data,
            }
        )


class MeAppointmentsView(APIView):
    """List and self-book the patient's own appointments."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        p = patient_profile(request)
        qs = p.appointments.all().order_by("-scheduled_for")
        return Response(AppointmentSerializer(qs, many=True).data)

    def post(self, request):
        p = patient_profile(request)
        appt = Appointment.objects.create(
            patient=p,
            scheduled_for=request.data.get("scheduled_for"),
            reason=request.data.get("reason", ""),
            status=Appointment.Status.BOOKED,
            created_by=request.user,
        )
        return Response(AppointmentSerializer(appt).data, status=201)


class HospitalPostViewSet(viewsets.ModelViewSet):
    """Patients read the feed; staff publish and manage it."""

    serializer_class = HospitalPostSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        qs = HospitalPost.objects.all()
        if not getattr(self.request.user, "is_staff_member", False):
            qs = qs.filter(published=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ShopDrugsView(generics.ListAPIView):
    """Medicines a patient can order (in stock)."""

    serializer_class = DrugSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Drug.objects.filter(active=True, stock_quantity__gt=0)
        search = self.request.query_params.get("search")
        return qs.filter(name__icontains=search) if search else qs


class DrugOrderViewSet(viewsets.ModelViewSet):
    """Patients place and track pharmacy orders; staff see and progress them."""

    serializer_class = DrugOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DrugOrder.objects.prefetch_related("items").select_related("patient")
        if getattr(self.request.user, "is_staff_member", False):
            return qs
        profile = getattr(self.request.user, "patient_profile", None)
        return qs.filter(patient=profile) if profile else qs.none()

    def perform_create(self, serializer):
        serializer.save(patient=patient_profile(self.request), created_by=self.request.user)
