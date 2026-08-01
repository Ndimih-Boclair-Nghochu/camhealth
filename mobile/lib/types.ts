// Domain types mirroring the CamHealth API. Kept self-contained so the Expo
// app bundles cleanly in Expo Go without monorepo path resolution.

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  role_display: string;
}

export interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  sex: string;
  age: number | null;
  phone: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  qr_payload: string;
}

export interface Consultation {
  id: string;
  complaint: string;
  diagnosis: string;
  doctor_name: string;
  created_at: string;
}

export interface LabResult {
  id: string;
  test_name: string;
  result_value: string;
  unit: string;
  flag: string;
  flag_display: string;
}

export interface LabOrder {
  id: string;
  patient_name: string;
  patient_code: string;
  status: string;
  status_display: string;
  items: LabResult[];
  created_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  patient_name: string;
  patient_code: string;
  status: string;
  status_display: string;
  total: string;
  amount_paid: string;
  balance: string;
}

export interface Appointment {
  id: string;
  patient_name: string;
  patient_code: string;
  scheduled_for: string;
  reason: string;
  status: string;
  status_display: string;
}

export interface Drug {
  id: string;
  name: string;
  unit: string;
  price: string;
  stock_quantity: number;
  reorder_level: number;
  stock_status: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: string;
  sample_type: string;
}

export interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  notes: string;
  items: PrescriptionItem[];
  created_at: string;
}

export interface HospitalPost {
  id: string;
  title: string;
  body: string;
  category: string;
  category_display: string;
  image_url: string;
  author_name: string;
  created_at: string;
}

export interface CartItem {
  drug: Drug;
  quantity: number;
}

export interface DrugOrderItem {
  id?: string;
  drug?: string | null;
  drug_name: string;
  unit_price: string;
  quantity: number;
  amount?: string;
}

export interface DrugOrder {
  id: string;
  status: string;
  status_display: string;
  fulfilment: string;
  payment_method: string;
  items: DrugOrderItem[];
  total: string;
  item_count: number;
  created_at: string;
}

export interface RecordsBundle {
  patient: Patient;
  consultations: Consultation[];
  prescriptions: Prescription[];
  lab_orders: LabOrder[];
  invoices: Invoice[];
}

export interface Paginated<T> {
  count: number;
  results: T[];
}
