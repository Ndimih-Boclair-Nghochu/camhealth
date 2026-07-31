import { useEffect, useState } from "react";
import { LabFlag, type LabOrder, type LabResult } from "@camhealth/shared";

import { api } from "../lib/api";

export default function Laboratory() {
  const [orders, setOrders] = useState<LabOrder[]>([]);

  async function load() {
    const { data } = await api.get<LabOrder[]>("/lab-orders/pending/");
    setOrders(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>Laboratory · Work list</h1>
      </div>

      {orders.length === 0 && <div className="card muted">No pending lab orders.</div>}

      {orders.map((order) => (
        <LabOrderCard key={order.id} order={order} onSaved={load} />
      ))}
    </div>
  );
}

function LabOrderCard({ order, onSaved }: { order: LabOrder; onSaved: () => void }) {
  const [items, setItems] = useState<LabResult[]>(order.items);
  const [saving, setSaving] = useState(false);

  function setItem(i: number, key: keyof LabResult, value: string) {
    const next = [...items];
    next[i] = { ...next[i], [key]: value } as LabResult;
    setItems(next);
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/lab-orders/${order.id}/`, {
        items: items.map((it) => ({
          id: it.id,
          test_name: it.test_name,
          result_value: it.result_value,
          unit: it.unit,
          normal_range: it.normal_range,
          flag: it.flag,
        })),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="panel-head">
        <h2>
          {order.patient_name} <span className="muted">· {order.patient_code}</span>
        </h2>
        <span className="pill status">{order.status_display}</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Normal range</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id ?? i}>
              <td>{it.test_name}</td>
              <td>
                <input value={it.result_value} onChange={(e) => setItem(i, "result_value", e.target.value)} />
              </td>
              <td>
                <input value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} />
              </td>
              <td>
                <input value={it.normal_range} onChange={(e) => setItem(i, "normal_range", e.target.value)} />
              </td>
              <td>
                <select value={it.flag} onChange={(e) => setItem(i, "flag", e.target.value)}>
                  {Object.values(LabFlag).map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="form-actions">
        <button className="btn primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save results"}
        </button>
      </div>
    </div>
  );
}
