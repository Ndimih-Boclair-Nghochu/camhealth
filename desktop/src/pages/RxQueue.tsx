import { useEffect, useState } from "react";
import type { Prescription } from "@camhealth/shared";

import { api } from "../lib/api";

export default function RxQueue() {
  const [list, setList] = useState<Prescription[]>([]);

  async function load() {
    const { data } = await api.get<Prescription[]>("/prescriptions/queue/");
    setList(data);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, fulfilment_status: string) {
    await api.patch(`/prescriptions/${id}/`, { fulfilment_status });
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Pharmacy prep queue</h1>
      </div>
      <p className="muted">Prescriptions to prepare so drugs are ready before the patient arrives.</p>

      {list.length === 0 && <div className="card muted">Nothing to prepare right now.</div>}

      {list.map((rx) => (
        <div className="card" key={rx.id}>
          <div className="panel-head">
            <h2>
              {rx.patient_name} <span className="muted">· {rx.patient_code}</span>
            </h2>
            <span className={`pill ${rx.fulfilment_status === "READY" ? "ok" : "partial"}`}>{rx.fulfilment_display}</span>
          </div>
          <div className="muted sm" style={{ marginBottom: 8 }}>
            {rx.pharmacy_name ? `Collect at ${rx.pharmacy_name}` : "No pharmacy assigned"}
            {" · "}
            {new Date(rx.created_at).toLocaleString()}
          </div>
          <ul style={{ margin: "0 0 10px 18px" }}>
            {rx.items.map((it, i) => (
              <li key={i}>
                <strong>{it.drug_name}</strong> {it.dosage} {it.frequency ? `— ${it.frequency}` : ""} {it.duration ? `(${it.duration})` : ""}
              </li>
            ))}
          </ul>
          <div className="form-actions">
            {rx.fulfilment_status === "PENDING" && (
              <button className="btn primary" onClick={() => setStatus(rx.id, "READY")}>Mark ready for collection</button>
            )}
            {rx.fulfilment_status === "READY" && (
              <button className="btn" onClick={() => setStatus(rx.id, "COLLECTED")}>Mark collected</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
