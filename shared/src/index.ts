/**
 * Shared domain types for CamHealth, mirroring the Django API in `server/`.
 * Imported by both the desktop (Electron) and mobile (Expo) apps so the two
 * clients never drift from each other or the backend.
 */

// ---- Enums (values match the backend TextChoices) ----

export enum Role {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  NURSE = "NURSE",
  RECEPTIONIST = "RECEPTIONIST",
  CASHIER = "CASHIER",
  PHARMACIST = "PHARMACIST",
}

export enum Sex {
  MALE = "M",
  FEMALE = "F",
  OTHER = "O",
}

export enum ConsultationStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
}

export enum PaymentMethod {
  CASH = "CASH",
  MOMO_MTN = "MOMO_MTN",
  MOMO_ORANGE = "MOMO_ORANGE",
}

export enum StockStatus {
  OK = "OK",
  LOW = "LOW",
  OUT = "OUT",
}

export enum StockMovementKind {
  IN = "IN",
  OUT = "OUT",
  ADJUST = "ADJUST",
}

export enum AppointmentStatus {
  BOOKED = "BOOKED",
  WAITING = "WAITING",
  IN_CONSULTATION = "IN_CONSULTATION",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export enum LabOrderStatus {
  ORDERED = "ORDERED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum LabFlag {
  PENDING = "PENDING",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  LOW = "LOW",
  ABNORMAL = "ABNORMAL",
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.MOMO_MTN]: "MTN Mobile Money",
  [PaymentMethod.MOMO_ORANGE]: "Orange Money",
};

export const ROLE_LABEL: Record<Role, string> = {
  [Role.ADMIN]: "Administrator",
  [Role.DOCTOR]: "Doctor",
  [Role.NURSE]: "Nurse",
  [Role.RECEPTIONIST]: "Receptionist",
  [Role.CASHIER]: "Cashier",
  [Role.PHARMACIST]: "Pharmacist",
};

// ---- Entities ----

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  role_display: string;
  is_active: boolean;
}

export interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  sex: Sex;
  date_of_birth: string | null;
  age: number | null;
  phone: string;
  address: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  qr_payload: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  patient: string;
  patient_name: string;
  patient_code: string;
  doctor: string | null;
  doctor_name: string;
  complaint: string;
  diagnosis: string;
  notes: string;
  temperature: string;
  blood_pressure: string;
  pulse: string;
  weight: string;
  status: ConsultationStatus;
  created_at: string;
}

export interface PrescriptionItem {
  id?: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  consultation: string | null;
  patient: string;
  patient_name: string;
  patient_code: string;
  prescriber: string | null;
  notes: string;
  items: PrescriptionItem[];
  pharmacy: string | null;
  pharmacy_name: string;
  pharmacy_address: string;
  fulfilment_status: string;
  fulfilment_display: string;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  booked_count: number;
  doctor_name: string;
  is_open: boolean;
  active: boolean;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: string;
  amount?: string;
}

export interface Payment {
  id: string;
  invoice: string;
  method: PaymentMethod;
  method_display: string;
  amount: string;
  reference: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  patient: string;
  patient_name: string;
  patient_code: string;
  consultation: string | null;
  status: InvoiceStatus;
  status_display: string;
  items: InvoiceItem[];
  payments: Payment[];
  total: string;
  amount_paid: string;
  balance: string;
  created_at: string;
}

export interface Drug {
  id: string;
  name: string;
  unit: string;
  price: string;
  stock_quantity: number;
  reorder_level: number;
  active: boolean;
  stock_status: StockStatus;
  is_low: boolean;
  is_out: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  drug: string;
  drug_name: string;
  kind: StockMovementKind;
  kind_display: string;
  quantity: number;
  reason: string;
  prescription: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient: string;
  patient_name: string;
  patient_code: string;
  scheduled_for: string;
  reason: string;
  status: AppointmentStatus;
  status_display: string;
  doctor: string | null;
  created_at: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: string;
  sample_type: string;
  normal_range: string;
  active: boolean;
}

export interface LabResult {
  id?: string;
  test: string | null;
  test_name: string;
  result_value: string;
  unit: string;
  normal_range: string;
  flag: LabFlag;
  flag_display?: string;
}

export interface LabOrder {
  id: string;
  patient: string;
  patient_name: string;
  patient_code: string;
  consultation: string | null;
  status: LabOrderStatus;
  status_display: string;
  notes: string;
  ordered_by: string | null;
  items: LabResult[];
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ---- API endpoint paths (relative to the API base, e.g. http://host:8000/api) ----

export const API = {
  token: "/auth/token/",
  tokenRefresh: "/auth/token/refresh/",
  me: "/users/me/",
  users: "/users/",
  auditLogs: "/audit-logs/",
  patients: "/patients/",
  consultations: "/consultations/",
  prescriptions: "/prescriptions/",
  invoices: "/invoices/",
  payments: "/payments/",
  drugs: "/drugs/",
  drugAlerts: "/drugs/alerts/",
  stockMovements: "/stock-movements/",
  appointments: "/appointments/",
  appointmentQueue: "/appointments/queue/",
  availability: "/availability/",
  pharmacies: "/pharmacies/",
  prescriptionQueue: "/prescriptions/queue/",
  labTests: "/lab-tests/",
  labOrders: "/lab-orders/",
  labOrdersPending: "/lab-orders/pending/",
} as const;
