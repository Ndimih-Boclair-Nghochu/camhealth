from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from pharmacy.models import Drug

from .models import HospitalPost


class PortalTests(APITestCase):
    def setUp(self):
        # A self-registered patient.
        res = self.client.post(
            "/api/auth/register/",
            {"username": "ada", "first_name": "Ada", "last_name": "Bih", "password": "secret123"},
            format="json",
        )
        self.token = res.json()["access"]
        self.auth()
        self.drug = Drug.objects.create(name="Paracetamol", price=Decimal("50"), stock_quantity=100)

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_patient_has_profile(self):
        res = self.client.get("/api/me/profile/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["patient_code"].startswith("CH-"))

    def test_patient_cannot_access_staff_endpoints(self):
        self.assertEqual(self.client.get("/api/patients/").status_code, 403)
        self.assertEqual(self.client.get("/api/invoices/").status_code, 403)

    def test_self_book_appointment(self):
        res = self.client.post(
            "/api/me/appointments/",
            {"scheduled_for": timezone.now().isoformat(), "reason": "Checkup"},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(self.client.get("/api/me/appointments/").json()[0]["reason"], "Checkup")

    def test_shop_lists_in_stock_drugs(self):
        res = self.client.get("/api/shop/drugs/")
        names = [d["name"] for d in res.json()["results"]]
        self.assertIn("Paracetamol", names)

    def test_place_and_view_drug_order(self):
        res = self.client.post(
            "/api/orders/",
            {
                "fulfilment": "DELIVERY", "payment_method": "MOMO_MTN", "address": "Mile 4",
                "items": [{"drug": str(self.drug.id), "drug_name": "Paracetamol", "unit_price": "50", "quantity": 3}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()["total"], "150.00")
        self.assertEqual(len(self.client.get("/api/orders/").json()["results"]), 1)

    def test_feed_shows_published_posts(self):
        HospitalPost.objects.create(title="Free malaria screening", body="This week only.", published=True)
        HospitalPost.objects.create(title="Draft", body="hidden", published=False)
        titles = [p["title"] for p in self.client.get("/api/posts/").json()["results"]]
        self.assertIn("Free malaria screening", titles)
        self.assertNotIn("Draft", titles)
