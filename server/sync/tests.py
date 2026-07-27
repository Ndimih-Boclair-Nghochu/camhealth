import uuid

from rest_framework.test import APITestCase

from accounts.models import User
from patients.models import Patient


class SyncProtocolTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="svc", password="pw", role="ADMIN", is_staff=True, is_superuser=True
        )
        self.client.force_authenticate(self.user)

    def _patient_row(self, pid, first="Sync", updated="2026-07-01T00:00:00+00:00"):
        return {
            "id": pid, "patient_code": "CH-900001", "first_name": first, "last_name": "Test",
            "sex": "M", "date_of_birth": None, "phone": "", "address": "", "blood_group": "",
            "allergies": "", "chronic_conditions": "", "created_by_id": None,
            "created_at": updated, "updated_at": updated,
        }

    def test_push_creates_record(self):
        pid = str(uuid.uuid4())
        payload = {"changes": {"patients.patient": [self._patient_row(pid)]}, "deletions": []}
        res = self.client.post("/api/sync/push/", payload, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["applied"]["created"], 1)
        p = Patient.objects.get(pk=pid)
        self.assertEqual(p.patient_code, "CH-900001")  # non-editable code preserved

    def test_reapply_identical_is_noop(self):
        pid = str(uuid.uuid4())
        row = self._patient_row(pid)
        self.client.post("/api/sync/push/", {"changes": {"patients.patient": [row]}}, format="json")
        res = self.client.post("/api/sync/push/", {"changes": {"patients.patient": [row]}}, format="json")
        self.assertEqual(res.json()["applied"]["created"], 0)
        self.assertEqual(res.json()["applied"]["updated"], 0)
        self.assertEqual(res.json()["applied"]["skipped"], 1)

    def test_pull_returns_changes_since_epoch(self):
        Patient.objects.create(first_name="Local", last_name="Patient", sex="F")
        res = self.client.get("/api/sync/pull/", {"since": "2020-01-01T00:00:00+00:00"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("patients.patient", res.json()["changes"])

    def test_delete_produces_tombstone_in_pull(self):
        p = Patient.objects.create(first_name="Del", last_name="Me", sex="M")
        pid = str(p.pk)
        p.delete()
        res = self.client.get("/api/sync/pull/", {"since": "2020-01-01T00:00:00+00:00"})
        ids = [d["id"] for d in res.json()["deletions"]]
        self.assertIn(pid, ids)
