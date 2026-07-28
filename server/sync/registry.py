"""The set of models that participate in sync, in dependency order.

Parents come before their children so that when a push is applied, foreign-key
targets already exist. Every model listed here has a ``updated_at`` field used
for change detection.
"""
from appointments.models import Appointment
from billing.models import Invoice, InvoiceItem, Payment
from clinical.models import Consultation, Prescription, PrescriptionItem
from patients.models import Patient
from pharmacy.models import Drug, StockMovement

SYNCABLE = [
    ("patients.patient", Patient),
    ("clinical.consultation", Consultation),
    ("clinical.prescription", Prescription),
    ("clinical.prescriptionitem", PrescriptionItem),
    ("billing.invoice", Invoice),
    ("billing.invoiceitem", InvoiceItem),
    ("billing.payment", Payment),
    ("pharmacy.drug", Drug),
    ("pharmacy.stockmovement", StockMovement),
    ("appointments.appointment", Appointment),
]

LABEL_TO_MODEL = {label: model for label, model in SYNCABLE}
MODEL_TO_LABEL = {model: label for label, model in SYNCABLE}
