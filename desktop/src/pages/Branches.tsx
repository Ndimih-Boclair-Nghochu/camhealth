import { useEffect, useState } from "react";
import type { Branch, Paginated } from "@camhealth/shared";

import { api } from "../lib/api";

const EMPTY = { name: "", address: "", city: "", phone: "" };

export default function Branches() {
  const [list, setList] = useState<Branch[]>([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ ...EMPTY });

  async function load() {
    const { data } = await api.get<Paginated<Branch>>("/branches/");
    setList(data.results);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/branches/", f);
    setF({ ...EMPTY });
    setShow(false);
    load();
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h1>Branches</h1>
        <button className="btn primary" onClick={() => setShow((s) => !s)}>{show ? "Close" : "+ Add branch"}</button>
      </div>
      <p className="muted">The hospital sites that staff can be assigned to.</p>

      {show && (
        <form className="card form-grid" onSubmit={add}>
          <div className="span2"><label>Name *</label><input required value={f.name} onChange={set("name")} /></div>
          <div><label>City</label><input value={f.city} onChange={set("city")} /></div>
          <div><label>Phone</label><input value={f.phone} onChange={set("phone")} /></div>
          <div className="span2"><label>Address</label><input value={f.address} onChange={set("address")} /></div>
          <div className="span2 form-actions"><button className="btn primary">Save branch</button></div>
        </form>
      )}

      <table className="table">
        <thead><tr><th>Name</th><th>City</th><th>Address</th><th>Phone</th></tr></thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.id}><td>{b.name}</td><td>{b.city || "—"}</td><td>{b.address || "—"}</td><td>{b.phone || "—"}</td></tr>
          ))}
          {list.length === 0 && <tr><td colSpan={4} className="muted">No branches yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
