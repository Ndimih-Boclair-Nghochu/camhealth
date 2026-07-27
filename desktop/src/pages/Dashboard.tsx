import { useEffect, useState } from "react";
import type { Invoice, Paginated, Patient } from "@camhealth/shared";

import { api, money } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recent, setRecent] = useState<Patient[]>([]);

  useEffect(() => {
    api.get<Paginated<Patient>>("/patients/").then((r) => {
      setPatients(r.data.count);
      setRecent(r.data.results.slice(0, 5));
    });
    api.get<Paginated<Invoice>>("/invoices/").then((r) => setInvoices(r.data.results));
  }, []);

  const outstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + Number(i.balance), 0);
  const collected = invoices.reduce((s, i) => s + Number(i.amount_paid), 0);

  return (
    <div>
      <h1>Welcome, {user?.first_name || user?.username}</h1>
      <p className="muted">Here is a snapshot of the facility today.</p>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">Registered patients</div>
          <div className="stat-value">{patients ?? "—"}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Invoices</div>
          <div className="stat-value">{invoices.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Collected</div>
          <div className="stat-value">{money(collected)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{money(outstanding)}</div>
        </div>
      </div>

      <h2>Recent patients</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Sex</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((p) => (
            <tr key={p.id}>
              <td>{p.patient_code}</td>
              <td>{p.full_name}</td>
              <td>{p.sex}</td>
              <td>{p.phone || "—"}</td>
            </tr>
          ))}
          {recent.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                No patients yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
