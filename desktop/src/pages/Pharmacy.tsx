import { useEffect, useState } from "react";
import { StockMovementKind, type Drug, type Paginated } from "@camhealth/shared";

import { api, money } from "../lib/api";

const EMPTY_DRUG = { name: "", unit: "tablet", price: "0", stock_quantity: 0, reorder_level: 10 };

export default function Pharmacy() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [alerts, setAlerts] = useState<Drug[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_DRUG });

  async function load() {
    const [d, a] = await Promise.all([
      api.get<Paginated<Drug>>("/drugs/"),
      api.get<Drug[]>("/drugs/alerts/"),
    ]);
    setDrugs(d.data.results);
    setAlerts(a.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addDrug(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/drugs/", form);
    setForm({ ...EMPTY_DRUG });
    setShowForm(false);
    load();
  }

  async function move(drug: Drug, kind: StockMovementKind) {
    const label = kind === StockMovementKind.IN ? "Restock quantity" : "Dispense quantity";
    const value = window.prompt(`${label} for ${drug.name}`);
    if (!value) return;
    await api.post("/stock-movements/", { drug: drug.id, kind, quantity: Number(value) });
    load();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h1>Pharmacy</h1>
        <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "+ Add drug"}
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="alert-banner">
          <strong>⚠ Stock alert —</strong> {alerts.length} item(s) need reordering:{" "}
          {alerts.map((d) => `${d.name} (${d.stock_quantity})`).join(", ")}
        </div>
      )}

      {showForm && (
        <form className="card form-grid" onSubmit={addDrug}>
          <div className="span2">
            <label>Drug name *</label>
            <input required value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label>Unit</label>
            <input value={form.unit} onChange={set("unit")} />
          </div>
          <div>
            <label>Price (FCFA)</label>
            <input type="number" value={form.price} onChange={set("price")} />
          </div>
          <div>
            <label>Opening stock</label>
            <input type="number" value={form.stock_quantity} onChange={set("stock_quantity")} />
          </div>
          <div>
            <label>Reorder level</label>
            <input type="number" value={form.reorder_level} onChange={set("reorder_level")} />
          </div>
          <div className="span2 form-actions">
            <button className="btn primary">Save drug</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Drug</th>
            <th>Unit</th>
            <th>Price</th>
            <th>In stock</th>
            <th>Reorder at</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {drugs.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.unit || "—"}</td>
              <td>{money(d.price)}</td>
              <td>{d.stock_quantity}</td>
              <td>{d.reorder_level}</td>
              <td>
                <span className={`pill ${d.stock_status.toLowerCase()}`}>{d.stock_status}</span>
              </td>
              <td className="row-actions">
                <button className="btn sm" onClick={() => move(d, StockMovementKind.IN)}>
                  Restock
                </button>
                <button className="btn sm" onClick={() => move(d, StockMovementKind.OUT)}>
                  Dispense
                </button>
              </td>
            </tr>
          ))}
          {drugs.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No drugs yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
