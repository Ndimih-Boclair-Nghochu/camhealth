import { useEffect, useState } from "react";
import { AppointmentStatus, type Appointment, type Paginated, type Patient } from "@camhealth/shared";

import { api } from "../lib/api";

const NEXT_STATUS: Partial<Record<AppointmentStatus, { to: AppointmentStatus; label: string }>> = {
  [AppointmentStatus.BOOKED]: { to: AppointmentStatus.WAITING, label: "Check in" },
  [AppointmentStatus.WAITING]: { to: AppointmentStatus.IN_CONSULTATION, label: "Start" },
  [AppointmentStatus.IN_CONSULTATION]: { to: AppointmentStatus.DONE, label: "Complete" },
};

export default function Appointments() {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    const [q, p] = await Promise.all([
      api.get<Appointment[]>("/appointments/queue/"),
      api.get<Paginated<Patient>>("/patients/"),
    ]);
    setQueue(q.data);
    setPatients(p.data.results);
  }

  useEffect(() => {
    load();
  }, []);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    await api.post("/appointments/", {
      patient: patientId,
      scheduled_for: new Date().toISOString(),
      reason,
      status: AppointmentStatus.WAITING,
    });
    setPatientId("");
    setReason("");
    setShowForm(false);
    load();
  }

  async function advance(a: Appointment, to: AppointmentStatus) {
    await api.patch(`/appointments/${a.id}/`, { status: to });
    load();
  }

  async function cancel(a: Appointment) {
    await api.patch(`/appointments/${a.id}/`, { status: AppointmentStatus.CANCELLED });
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Appointments · Today's queue</h1>
        <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "+ Add to queue"}
        </button>
      </div>

      {showForm && (
        <form className="card form-grid" onSubmit={book}>
          <div className="span2">
            <label>Patient *</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patient_code} — {p.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="span2">
            <label>Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="span2 form-actions">
            <button className="btn primary">Add to queue</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Patient</th>
            <th>Reason</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {queue.map((a, i) => {
            const next = NEXT_STATUS[a.status];
            return (
              <tr key={a.id}>
                <td>{i + 1}</td>
                <td>{new Date(a.scheduled_for).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>
                  {a.patient_name} <span className="muted">· {a.patient_code}</span>
                </td>
                <td>{a.reason || "—"}</td>
                <td>
                  <span className="pill status">{a.status_display}</span>
                </td>
                <td className="row-actions">
                  {next && (
                    <button className="btn sm primary" onClick={() => advance(a, next.to)}>
                      {next.label}
                    </button>
                  )}
                  <button className="btn sm" onClick={() => cancel(a)}>
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
          {queue.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Queue is empty.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
