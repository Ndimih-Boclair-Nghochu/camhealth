import { useEffect, useState } from "react";
import type { Paginated, Pharmacy } from "@camhealth/shared";

import { api } from "../lib/api";

const EMPTY = { name: "", address: "", city: "", phone: "" };

export default function Pharmacies() {
  const [list, setList] = useState<Pharmacy[]>([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ ...EMPTY });

  async function load() {
    const { data } = await api.get<Paginated<Pharmacy>>("/pharmacies/");
    setList(data.results);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/pharmacies/", f);
    setF({ ...EMPTY });
    setShow(false);
    load();
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h1>Pharmacy branches</h1>
        <button className="btn primary" onClick={() => setShow((s) => !s)}>{show ? "Close" : "+ Add pharmacy"}</button>
      </div>
      <p className="muted">Prescriptions can be routed to any of these branches for the patient to collect.</p>

      {show && (
        <form className="card form-grid" onSubmit={add}>
          <div className="span2"><label>Name *</label><input required value={f.name} onChange={set("name")} /></div>
          <div><label>City</label><input value={f.city} onChange={set("city")} /></div>
          <div><label>Phone</label><input value={f.phone} onChange={set("phone")} /></div>
          <div className="span2"><label>Address</label><input value={f.address} onChange={set("address")} /></div>
          <div className="span2 form-actions"><button className="btn primary">Save pharmacy</button></div>
        </form>
      )}

      <table className="table">
        <thead><tr><th>Name</th><th>City</th><th>Address</th><th>Phone</th><th>Status</th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.city || "—"}</td><td>{p.address || "—"}</td><td>{p.phone || "—"}</td>
              <td><span className={`pill ${p.active ? "ok" : "unpaid"}`}>{p.active ? "Active" : "Inactive"}</span></td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={5} className="muted">No pharmacies yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
