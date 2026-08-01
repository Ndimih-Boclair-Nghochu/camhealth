from rest_framework.test import APITestCase

from .models import Branch, Role, User


class RegistrationTests(APITestCase):
    def test_register_creates_account_and_returns_tokens(self):
        res = self.client.post(
            "/api/auth/register/",
            {"username": "drmbah", "first_name": "Paul", "last_name": "Mbah", "password": "secret123"},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertIn("access", body)
        self.assertIn("refresh", body)
        self.assertEqual(body["user"]["role"], "PATIENT")
        user = User.objects.get(username="drmbah")
        # A linked health profile is auto-created for self-registered patients.
        self.assertTrue(hasattr(user, "patient_profile"))
        self.assertEqual(user.patient_profile.first_name, "Paul")

    def test_new_account_can_use_its_token(self):
        access = self.client.post(
            "/api/auth/register/",
            {"username": "nurse1", "password": "secret123"},
            format="json",
        ).json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        me = self.client.get("/api/users/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "nurse1")

    def test_duplicate_username_rejected(self):
        User.objects.create_user(username="taken", password="x")
        res = self.client.post(
            "/api/auth/register/",
            {"username": "taken", "password": "secret123"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)


class StaffAndActivationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="pw", role=Role.ADMIN, is_staff=True, is_superuser=True
        )
        self.client.force_authenticate(self.admin)

    def test_admin_creates_staff_with_matricule(self):
        branch = Branch.objects.create(name="Mile 4 Branch", city="Bamenda")
        res = self.client.post(
            "/api/staff/",
            {"first_name": "Grace", "last_name": "Njoya", "role": "NURSE", "branch": str(branch.id)},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertTrue(body["matricule"].startswith("STF-"))
        self.assertFalse(body["activated"])
        self.assertEqual(body["branch_name"], "Mile 4 Branch")

    def test_non_admin_cannot_create_staff(self):
        nurse = User.objects.create_user(username="n1", password="pw", role=Role.NURSE, is_staff=True)
        self.client.force_authenticate(nurse)
        res = self.client.post("/api/staff/", {"first_name": "X", "role": "NURSE"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_staff_activates_with_matricule_then_logs_in(self):
        matricule = self.client.post(
            "/api/staff/", {"first_name": "Sam", "role": "DOCTOR"}, format="json"
        ).json()["matricule"]
        self.client.force_authenticate(user=None)
        # Cannot log in before activation
        pre = self.client.post("/api/auth/token/", {"username": matricule, "password": "newpass1"}, format="json")
        self.assertEqual(pre.status_code, 401)
        # Activate
        res = self.client.post(
            "/api/auth/activate/", {"matricule": matricule, "password": "newpass1", "username": "drsam"}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["user"]["role"], "DOCTOR")
        # Now can log in
        ok = self.client.post("/api/auth/token/", {"username": "drsam", "password": "newpass1"}, format="json")
        self.assertEqual(ok.status_code, 200)

    def test_staff_registered_patient_gets_code_and_can_activate(self):
        from patients.models import Patient

        p = Patient.objects.create(first_name="Ako", last_name="Tabi", sex="M")
        self.assertTrue(p.activation_code.startswith("PT-"))
        self.client.force_authenticate(user=None)
        res = self.client.post(
            "/api/auth/activate/", {"matricule": p.activation_code, "password": "mypass12", "username": "akotabi"}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["user"]["role"], "PATIENT")
        p.refresh_from_db()
        self.assertIsNotNone(p.account_id)

    def test_bad_matricule_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/auth/activate/", {"matricule": "STF-NOPE12", "password": "whatever1"}, format="json")
        self.assertEqual(res.status_code, 400)
