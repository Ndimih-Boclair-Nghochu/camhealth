from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import Role, User
from appointments.models import AvailabilitySlot
from clinical.models import Prescription
from pharmacy.models import Drug, Pharmacy

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

    @property
    def profile(self):
        return User.objects.get(username="ada").patient_profile

    def test_book_available_slot(self):
        slot = AvailabilitySlot.objects.create(starts_at=timezone.now() + timedelta(days=1), capacity=1)
        # Patient sees it as open
        self.assertEqual(len(self.client.get("/api/availability/").json()["results"]), 1)
        res = self.client.post("/api/me/appointments/", {"slot": str(slot.id), "reason": "Checkup"}, format="json")
        self.assertEqual(res.status_code, 201, res.content)
        slot.refresh_from_db()
        self.assertEqual(slot.booked_count, 1)
        self.assertFalse(slot.is_open)  # now full
        # No longer listed as open
        self.assertEqual(len(self.client.get("/api/availability/").json()["results"]), 0)

    def test_prescription_routed_to_pharmacy_visible_to_patient(self):
        pharm = Pharmacy.objects.create(name="Mile 4 Pharmacy", address="Mile 4, Bamenda", phone="670000000")
        Prescription.objects.create(patient=self.profile, pharmacy=pharm, fulfilment_status="READY")
        rx = self.client.get("/api/me/records/").json()["prescriptions"][0]
        self.assertEqual(rx["pharmacy_name"], "Mile 4 Pharmacy")
        self.assertEqual(rx["fulfilment_status"], "READY")
        self.assertEqual(rx["pharmacy_address"], "Mile 4, Bamenda")

    def test_symptom_check(self):
        with patch("portal.views.symptom_reply", return_value="Rest, drink water and get a malaria test."):
            res = self.client.post("/api/symptom-check/", {"message": "I have fever and headache"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("malaria test", res.json()["reply"])

    def test_symptom_check_requires_message(self):
        self.assertEqual(self.client.post("/api/symptom-check/", {"message": ""}, format="json").status_code, 400)


class GeofenceTests(APITestCase):
    HOSP = {"latitude": 5.9631, "longitude": 10.1591}

    def setUp(self):
        from portal.models import Facility
        Facility.objects.create(geofence_radius_m=250, **self.HOSP)
        self.a = User.objects.create_user("docA", password="pw", role=Role.DOCTOR, is_staff=True)
        self.b = User.objects.create_user("nurseB", password="pw", role=Role.NURSE, is_staff=True)

    def as_user(self, u):
        self.client.force_authenticate(u)

    def test_facility_is_readable(self):
        self.as_user(self.a)
        res = self.client.get("/api/facility/")
        self.assertEqual(res.status_code, 200)
        self.assertAlmostEqual(res.json()["latitude"], 5.9631, places=3)

    def test_on_site_staff_can_see_each_other(self):
        self.as_user(self.a)
        self.client.post("/api/me/location/", self.HOSP, format="json")
        self.as_user(self.b)
        r = self.client.post("/api/me/location/", {"latitude": 5.9632, "longitude": 10.1592}, format="json")
        self.assertTrue(r.json()["at_hospital"])
        self.as_user(self.a)
        res = self.client.get("/api/staff/on-site/").json()
        self.assertTrue(res["on_site"])
        self.assertEqual([s["name"] for s in res["staff"]], ["nurseB"])

    def test_off_site_staff_cannot_locate_anyone(self):
        # A is far from the hospital
        self.as_user(self.a)
        r = self.client.post("/api/me/location/", {"latitude": 6.5, "longitude": 11.0}, format="json")
        self.assertFalse(r.json()["at_hospital"])
        # B is on site
        self.as_user(self.b)
        self.client.post("/api/me/location/", self.HOSP, format="json")
        # A (off site) is denied the roster
        self.as_user(self.a)
        res = self.client.get("/api/staff/on-site/").json()
        self.assertFalse(res["on_site"])
        self.assertEqual(res["staff"], [])
