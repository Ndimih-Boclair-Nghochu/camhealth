from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from patients.models import Patient

from .models import Appointment


class AppointmentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="recep", password="pw", role="RECEPTIONIST", is_staff=True
        )
        self.client.force_authenticate(self.user)
        self.patient = Patient.objects.create(first_name="Q", last_name="Patient", sex="F")

    def test_book_and_queue(self):
        res = self.client.post(
            "/api/appointments/",
            {
                "patient": str(self.patient.id),
                "scheduled_for": timezone.now().isoformat(),
                "reason": "Fever",
                "status": "WAITING",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        queue = self.client.get("/api/appointments/queue/").json()
        self.assertEqual(len(queue), 1)
        self.assertEqual(queue[0]["patient_code"], self.patient.patient_code)

    def test_done_appointment_leaves_queue(self):
        Appointment.objects.create(
            patient=self.patient, scheduled_for=timezone.now(), status="DONE"
        )
        self.assertEqual(self.client.get("/api/appointments/queue/").json(), [])
