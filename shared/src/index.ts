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
  created_at: string;
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
} as const;
