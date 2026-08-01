from rest_framework.test import APITestCase

from .models import User


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
