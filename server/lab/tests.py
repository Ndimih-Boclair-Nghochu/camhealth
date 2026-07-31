from rest_framework.test import APITestCase

from accounts.models import User
from patients.models import Patient

from .models import LabOrder, LabTest


class LabTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="lab", password="pw", role="NURSE", is_staff=True)
        self.client.force_authenticate(self.user)
        self.patient = Patient.objects.create(first_name="Lab", last_name="Patient", sex="M")
        self.test = LabTest.objects.create(name="Malaria RDT", price=1500)

    def test_order_starts_pending(self):
        res = self.client.post(
            "/api/lab-orders/",
            {
                "patient": str(self.patient.id),
                "items": [
                    {"test": str(self.test.id), "test_name": "Malaria RDT"},
                    {"test_name": "Full blood count"},
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()["status"], "ORDERED")
        pending = self.client.get("/api/lab-orders/pending/").json()
        self.assertEqual(len(pending), 1)
        self.assertEqual(len(pending[0]["items"]), 2)

    def test_entering_all_results_completes_and_leaves_pending(self):
        order = self.client.post(
            "/api/lab-orders/",
            {"patient": str(self.patient.id), "items": [{"test_name": "Glucose"}]},
            format="json",
        ).json()
        item = order["items"][0]
        res = self.client.patch(
            f"/api/lab-orders/{order['id']}/",
            {"items": [{"id": item["id"], "test_name": "Glucose", "result_value": "0.9", "flag": "NORMAL"}]},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["status"], "COMPLETED")
        self.assertEqual(self.client.get("/api/lab-orders/pending/").json(), [])
