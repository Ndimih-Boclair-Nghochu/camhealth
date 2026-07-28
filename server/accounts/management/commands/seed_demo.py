"""Create demo staff accounts and a little sample data so the API/admin is
immediately explorable. Safe to run repeatedly (idempotent on usernames/codes).

    python manage.py seed_demo
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from accounts.models import Role, User
from billing.models import Invoice, InvoiceItem, Payment
from clinical.models import Consultation, Prescription, PrescriptionItem
from patients.models import Patient
from pharmacy.models import Drug

DEMO_STAFF = [
    ("admin", "Ada", "Ndifor", Role.ADMIN, True),
    ("doctor", "Emma", "Tabi", Role.DOCTOR, False),
    ("reception", "Rose", "Ako", Role.RECEPTIONIST, False),
    ("cashier", "Carl", "Mbah", Role.CASHIER, False),
]


class Command(BaseCommand):
    help = "Seed demo users and sample records for CamHealth."

    def handle(self, *args, **options):
        for username, first, last, role, is_super in DEMO_STAFF:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last, "role": role},
            )
            if created:
                user.set_password("camhealth123")
                user.is_staff = True
                user.is_superuser = is_super
                user.save()
                self.stdout.write(f"  + user {username} / camhealth123 ({role})")

        admin = User.objects.get(username="admin")
        doctor = User.objects.get(username="doctor")

        if not Patient.objects.exists():
            p1 = Patient.objects.create(
                first_name="Ngwa", last_name="Bih", sex="F", phone="670000001",
                address="Mile 4, Bamenda", blood_group="O+",
                allergies="Penicillin", created_by=admin,
            )
            Patient.objects.create(
                first_name="Tanka", last_name="Fru", sex="M", phone="670000002",
                address="Nkwen, Bamenda", blood_group="A+", created_by=admin,
            )

            c = Consultation.objects.create(
                patient=p1, doctor=doctor, complaint="Fever and headache for 3 days",
                diagnosis="Malaria (confirmed by RDT)", temperature="38.6",
                blood_pressure="110/70", pulse="88", weight="61",
                created_by=doctor,
            )
            rx = Prescription.objects.create(
                patient=p1, consultation=c, prescriber=doctor,
                notes="Complete the full course.", created_by=doctor,
            )
            PrescriptionItem.objects.create(
                prescription=rx, drug_name="Artemether/Lumefantrine",
                dosage="80/480mg", frequency="Twice daily", duration="3 days",
            )
            PrescriptionItem.objects.create(
                prescription=rx, drug_name="Paracetamol", dosage="1g",
                frequency="Every 8 hours", duration="3 days",
            )

            inv = Invoice.objects.create(patient=p1, consultation=c, created_by=admin)
            InvoiceItem.objects.create(invoice=inv, description="Consultation", quantity=1, unit_price=Decimal("3000"))
            InvoiceItem.objects.create(invoice=inv, description="Malaria RDT", quantity=1, unit_price=Decimal("1500"))
            InvoiceItem.objects.create(invoice=inv, description="Medicines", quantity=1, unit_price=Decimal("4200"))
            Payment.objects.create(invoice=inv, method=Payment.Method.MOMO_MTN, amount=Decimal("8700"), reference="MTN123456", received_by=admin)
            inv.refresh_status()
            self.stdout.write("  + sample patient, consultation, prescription and paid invoice")

        if not Drug.objects.exists():
            Drug.objects.create(name="Artemether/Lumefantrine", unit="tablet", price=Decimal("250"), stock_quantity=180, reorder_level=40)
            Drug.objects.create(name="Paracetamol 1g", unit="tablet", price=Decimal("50"), stock_quantity=500, reorder_level=100)
            Drug.objects.create(name="Amoxicillin 500mg", unit="capsule", price=Decimal("75"), stock_quantity=25, reorder_level=50)  # LOW
            Drug.objects.create(name="ORS sachet", unit="sachet", price=Decimal("100"), stock_quantity=0, reorder_level=20)  # OUT
            self.stdout.write("  + sample pharmacy drugs (incl. one low, one out of stock)")

        self.stdout.write(self.style.SUCCESS("Demo data ready. Login: admin / camhealth123"))
