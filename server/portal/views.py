from rest_framework import generics, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import F

from appointments.models import Appointment, AvailabilitySlot
from appointments.serializers import AppointmentSerializer
from billing.serializers import InvoiceSerializer
from clinical.serializers import ConsultationSerializer, PrescriptionSerializer
from common.permissions import IsStaffOrReadOnly
from lab.serializers import LabOrderSerializer
from patients.models import Patient
from patients.serializers import PatientSerializer
from pharmacy.models import Drug
from pharmacy.serializers import DrugSerializer

from .ai import symptom_reply
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
        slot_id = request.data.get("slot")
        slot = None
        scheduled_for = request.data.get("scheduled_for")

        if slot_id:
            slot = AvailabilitySlot.objects.filter(pk=slot_id).first()
            if not slot or not slot.is_open:
                return Response({"detail": "That time is no longer available."}, status=400)
            scheduled_for = slot.starts_at

        if not scheduled_for:
            return Response({"detail": "Choose an available time."}, status=400)

        appt = Appointment.objects.create(
            patient=p,
            scheduled_for=scheduled_for,
            reason=request.data.get("reason", ""),
            status=Appointment.Status.BOOKED,
            doctor=slot.doctor if slot else None,
            slot=slot,
            created_by=request.user,
        )
        if slot:
            AvailabilitySlot.objects.filter(pk=slot.pk).update(booked_count=F("booked_count") + 1)
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


class SymptomCheckView(APIView):
    """AI symptom triage (guidance, not diagnosis)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"detail": "Describe your symptoms."}, status=400)
        try:
            reply = symptom_reply(message, request.data.get("history"))
        except Exception:
            return Response(
                {"detail": "The assistant is unavailable right now. Please try again later."},
                status=503,
            )
        return Response({"reply": reply})


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
