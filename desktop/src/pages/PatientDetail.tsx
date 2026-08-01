import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  PaymentMethod,
  PAYMENT_METHOD_LABEL,
  type Consultation,
  type Invoice,
  type InvoiceItem,
  type LabOrder,
  type LabTest,
  type Paginated,
  type Pharmacy,
  type Patient,
  type PrescriptionItem,
} from "@camhealth/shared";

import { api, money } from "../lib/api";

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  async function loadAll() {
    const [p, c, i] = await Promise.all([
      api.get<Patient>(`/patients/${id}/`),
      api.get<Paginated<Consultation>>(`/consultations/`, { params: { patient: id } }),
      api.get<Paginated<Invoice>>(`/invoices/`, { params: { patient: id } }),
    ]);
    setPatient(p.data);
    setConsultations(c.data.results);
    setInvoices(i.data.results);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!patient) return <div className="muted">Loading patient…</div>;

  return (
    <div>
      <div className="page-head">
        <h1>
          {patient.full_name} <span className="muted">· {patient.patient_code}</span>
        </h1>
      </div>

      <div className="detail-grid">
        <div className="card idcard">
          <QRCodeSVG value={patient.qr_payload} size={104} />
          <div className="idcard-info">
            <div>
              <span className="muted">Sex</span> {patient.sex} &nbsp;·&nbsp;
              <span className="muted">Age</span> {patient.age ?? "—"}
            </div>
            <div>
              <span className="muted">Phone</span> {patient.phone || "—"}
            </div>
            <div>
              <span className="muted">Blood</span> {patient.blood_group || "—"}
            </div>
            {patient.allergies && <div className="warn">Allergies: {patient.allergies}</div>}
            {patient.chronic_conditions && (
              <div className="warn">Chronic: {patient.chronic_conditions}</div>
            )}
          </div>
        </div>

        <ConsultationPanel patientId={patient.id} consultations={consultations} onSaved={loadAll} />
      </div>

      <BillingPanel patientId={patient.id} invoices={invoices} onChanged={loadAll} />

      <LabPanel patientId={patient.id} />
    </div>
  );
}

/* ---------------- Laboratory ---------------- */

function LabPanel({ patientId }: { patientId: string }) {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [t, o] = await Promise.all([
      api.get<Paginated<LabTest>>("/lab-tests/"),
      api.get<Paginated<LabOrder>>("/lab-orders/", { params: { patient: patientId } }),
    ]);
    setTests(t.data.results);
    setOrders(o.data.results);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function order(e: React.FormEvent) {
    e.preventDefault();
    const items = tests
      .filter((t) => picked[t.id])
      .map((t) => ({ test: t.id, test_name: t.name }));
    if (!items.length) return;
    setSaving(true);
    try {
      await api.post("/lab-orders/", { patient: patientId, items });
      setPicked({});
      setOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="panel-head">
        <h2>Laboratory</h2>
        <button className="btn primary sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "+ Order tests"}
        </button>
      </div>

      {open && (
        <form onSubmit={order}>
          <div className="chips-pick">
            {tests.map((t) => (
              <label key={t.id} className="pick">
                <input
                  type="checkbox"
                  checked={!!picked[t.id]}
                  onChange={(e) => setPicked({ ...picked, [t.id]: e.target.checked })}
                />
                {t.name}
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn primary" disabled={saving}>
              {saving ? "Ordering…" : "Order selected tests"}
            </button>
          </div>
        </form>
      )}

      <ul className="timeline">
        {orders.map((o) => (
          <li key={o.id}>
            <div className="tl-date">{new Date(o.created_at).toLocaleDateString()}</div>
            <div>
              <span className={`pill ${o.status === "COMPLETED" ? "ok" : "status"}`}>{o.status_display}</span>
              <div className="sm" style={{ marginTop: 4 }}>
                {o.items.map((it) => (
                  <div key={it.id}>
                    <strong>{it.test_name}:</strong>{" "}
                    {it.result_value ? (
                      <>
                        {it.result_value} {it.unit}{" "}
                        {it.flag !== "PENDING" && it.flag !== "NORMAL" && (
                          <span className="warn">({it.flag_display})</span>
                        )}
                      </>
                    ) : (
                      <span className="muted">pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
        {orders.length === 0 && <li className="muted">No lab orders yet.</li>}
      </ul>
    </div>
  );
}

/* ---------------- Consultation + e-prescription ---------------- */

function ConsultationPanel({
  patientId,
  consultations,
  onSaved,
}: {
  patientId: string;
  consultations: Consultation[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    complaint: "",
    diagnosis: "",
    temperature: "",
    blood_pressure: "",
    pulse: "",
    weight: "",
    notes: "",
  });
  const [rx, setRx] = useState<PrescriptionItem[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacyId, setPharmacyId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Paginated<Pharmacy>>("/pharmacies/").then((r) => setPharmacies(r.data.results));
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  function addDrug() {
    setRx([...rx, { drug_name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  }
  function setDrug(i: number, k: keyof PrescriptionItem, v: string) {
    const next = [...rx];
    next[i] = { ...next[i], [k]: v };
    setRx(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: consult } = await api.post<Consultation>("/consultations/", {
        patient: patientId,
        ...f,
      });
      const drugs = rx.filter((d) => d.drug_name.trim());
      if (drugs.length) {
        await api.post("/prescriptions/", {
          patient: patientId,
          consultation: consult.id,
          notes: "",
          pharmacy: pharmacyId || null,
          items: drugs,
        });
      }
      setPharmacyId("");
      setF({ complaint: "", diagnosis: "", temperature: "", blood_pressure: "", pulse: "", weight: "", notes: "" });
      setRx([]);
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="panel-head">
        <h2>Consultations</h2>
        <button className="btn primary sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "+ New consultation"}
        </button>
      </div>

      {open && (
        <form className="form-grid" onSubmit={save}>
          <div className="span2">
            <label>Complaint *</label>
            <input required value={f.complaint} onChange={set("complaint")} />
          </div>
          <div className="span2">
            <label>Diagnosis</label>
            <input value={f.diagnosis} onChange={set("diagnosis")} />
          </div>
          <div>
            <label>Temp (°C)</label>
            <input value={f.temperature} onChange={set("temperature")} />
          </div>
          <div>
            <label>BP</label>
            <input value={f.blood_pressure} onChange={set("blood_pressure")} placeholder="120/80" />
          </div>
          <div>
            <label>Pulse</label>
            <input value={f.pulse} onChange={set("pulse")} />
          </div>
          <div>
            <label>Weight (kg)</label>
            <input value={f.weight} onChange={set("weight")} />
          </div>

          <div className="span2">
            <div className="panel-head">
              <label>Prescription</label>
              <button type="button" className="btn sm" onClick={addDrug}>
                + Add drug
              </button>
            </div>
            {rx.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <label>Collect at pharmacy</label>
                <select value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)}>
                  <option value="">— Select a pharmacy —</option>
                  {pharmacies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.city ? ` (${p.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {rx.map((d, i) => (
              <div className="rx-row" key={i}>
                <input placeholder="Drug" value={d.drug_name} onChange={(e) => setDrug(i, "drug_name", e.target.value)} />
                <input placeholder="Dosage" value={d.dosage} onChange={(e) => setDrug(i, "dosage", e.target.value)} />
                <input placeholder="Frequency" value={d.frequency} onChange={(e) => setDrug(i, "frequency", e.target.value)} />
                <input placeholder="Duration" value={d.duration} onChange={(e) => setDrug(i, "duration", e.target.value)} />
              </div>
            ))}
          </div>

          <div className="span2 form-actions">
            <button className="btn primary" disabled={saving}>
              {saving ? "Saving…" : "Save consultation"}
            </button>
          </div>
        </form>
      )}

      <ul className="timeline">
        {consultations.map((c) => (
          <li key={c.id}>
            <div className="tl-date">{new Date(c.created_at).toLocaleDateString()}</div>
            <div>
              <strong>{c.diagnosis || c.complaint}</strong>
              <div className="muted sm">
                {c.complaint}
                {c.doctor_name ? ` · Dr ${c.doctor_name}` : ""}
              </div>
            </div>
          </li>
        ))}
        {consultations.length === 0 && <li className="muted">No consultations yet.</li>}
      </ul>
    </div>
  );
}

/* ---------------- Billing ---------------- */

function BillingPanel({
  patientId,
  invoices,
  onChanged,
}: {
  patientId: string;
  invoices: Invoice[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "Consultation", quantity: 1, unit_price: "3000" }]);
  const [saving, setSaving] = useState(false);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit_price: "0" }]);
  }
  function setItem(i: number, k: keyof InvoiceItem, v: string) {
    const next = [...items];
    next[i] = { ...next[i], [k]: k === "quantity" ? Number(v) : v } as InvoiceItem;
    setItems(next);
  }
  const total = items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/invoices/", { patient: patientId, items });
      setItems([{ description: "Consultation", quantity: 1, unit_price: "3000" }]);
      setOpen(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="panel-head">
        <h2>Billing</h2>
        <button className="btn primary sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "+ New invoice"}
        </button>
      </div>

      {open && (
        <form onSubmit={create}>
          {items.map((it, i) => (
            <div className="rx-row" key={i}>
              <input placeholder="Description" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
              <input type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
              <input type="number" min={0} value={it.unit_price} onChange={(e) => setItem(i, "unit_price", e.target.value)} />
              <div className="line-amount">{money(Number(it.unit_price) * Number(it.quantity))}</div>
            </div>
          ))}
          <div className="form-actions space-between">
            <button type="button" className="btn sm" onClick={addItem}>
              + Add line
            </button>
            <div className="total">Total: {money(total)}</div>
          </div>
          <div className="form-actions">
            <button className="btn primary" disabled={saving}>
              {saving ? "Creating…" : "Create invoice"}
            </button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <InvoiceRow key={inv.id} invoice={inv} onChanged={onChanged} />
          ))}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No invoices yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceRow({ invoice, onChanged }: { invoice: Invoice; onChanged: () => void }) {
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState(invoice.balance);
  const [reference, setReference] = useState("");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/payments/", { invoice: invoice.id, method, amount, reference });
    setPaying(false);
    setReference("");
    onChanged();
  }

  return (
    <>
      <tr>
        <td>{invoice.number}</td>
        <td>{money(invoice.total)}</td>
        <td>{money(invoice.amount_paid)}</td>
        <td>{money(invoice.balance)}</td>
        <td>
          <span className={`pill ${invoice.status.toLowerCase()}`}>{invoice.status_display}</span>
        </td>
        <td>
          {invoice.status !== "PAID" && (
            <button className="btn sm" onClick={() => setPaying((p) => !p)}>
              {paying ? "Cancel" : "Record payment"}
            </button>
          )}
        </td>
      </tr>
      {paying && (
        <tr>
          <td colSpan={6}>
            <form className="pay-row" onSubmit={pay}>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {Object.values(PaymentMethod).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              {method !== PaymentMethod.CASH && (
                <input placeholder="MoMo reference" value={reference} onChange={(e) => setReference(e.target.value)} />
              )}
              <button className="btn primary sm">Confirm</button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
