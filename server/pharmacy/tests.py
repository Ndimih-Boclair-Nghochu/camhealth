from decimal import Decimal

from rest_framework.test import APITestCase

from accounts.models import User

from .models import Drug


class PharmacyTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="pharm", password="pw", role="PHARMACIST", is_staff=True
        )
        self.client.force_authenticate(self.user)
        self.drug = Drug.objects.create(
            name="Paracetamol", unit="tablet", price=Decimal("50"),
            stock_quantity=100, reorder_level=20,
        )

    def test_dispense_decrements_stock(self):
        res = self.client.post(
            "/api/stock-movements/",
            {"drug": str(self.drug.id), "kind": "OUT", "quantity": 30},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.drug.refresh_from_db()
        self.assertEqual(self.drug.stock_quantity, 70)

    def test_restock_increments_stock(self):
        self.client.post(
            "/api/stock-movements/",
            {"drug": str(self.drug.id), "kind": "IN", "quantity": 50},
            format="json",
        )
        self.drug.refresh_from_db()
        self.assertEqual(self.drug.stock_quantity, 150)

    def test_low_stock_alert(self):
        self.drug.stock_quantity = 15
        self.drug.save()
        res = self.client.get("/api/drugs/alerts/")
        names = [d["name"] for d in res.json()]
        self.assertIn("Paracetamol", names)
        self.assertEqual(self.drug.stock_status, "LOW")

    def test_healthy_stock_not_in_alerts(self):
        res = self.client.get("/api/drugs/alerts/")
        self.assertEqual(res.json(), [])
