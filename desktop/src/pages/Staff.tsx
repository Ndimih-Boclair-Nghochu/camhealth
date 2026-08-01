import { useEffect, useState } from "react";
import type { Branch, Paginated, StaffMember } from "@camhealth/shared";

import { api } from "../lib/api";

const ROLES = ["DOCTOR", "NURSE", "RECEPTIONIST", "CASHIER", "PHARMACIST", "ADMIN"];
const EMPTY = { first_name: "", last_name: "", role: "NURSE", phone: "", branch: "" };

export default function Staff() {
  const [list, setList] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ ...EMPTY });
  const [created, setCreated] = useState<StaffMember | null>(null);

  async function load() {
    const [s, b] = await Promise.all([
      api.get<Paginated<StaffMember>>("/staff/"),
      api.get<Paginated<Branch>>("/branches/"),
    ]);
    setList(s.data.results);
    setBranches(b.data.results);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...f, branch: f.branch || null };
    const { data } = await api.post<StaffMember>("/staff/", payload);
    setCreated(data);
    setF({ ...EMPTY });
    setShow(false);
    load();
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h1>Staff</h1>
        <button className="btn primary" onClick={() => { setShow((s) => !s); setCreated(null); }}>
          {show ? "Close" : "+ Add staff"}
        </button>
      </div>
      <p className="muted">Add staff for any branch. Each new member gets a matricule to activate their account in the app.</p>

      {created && (
        <div className="card" style={{ borderLeft: "4px solid #1d6f6b" }}>
          <h2>Staff created — give them this matricule</h2>
          <p>
            <strong>{created.full_name}</strong> · {created.role_display}
            {created.branch_name ? ` · ${created.branch_name}` : ""}
          </p>
          <div className="matricule">{created.matricule}</div>
          <p className="muted sm">They open the app → “Activate with a matricule” → enter this code → set a password.</p>
        </div>
      )}

      {show && (
        <form className="card form-grid" onSubmit={add}>
          <div><label>First name *</label><input required value={f.first_name} onChange={set("first_name")} /></div>
          <div><label>Last name *</label><input required value={f.last_name} onChange={set("last_name")} /></div>
          <div>
            <label>Role</label>
            <select value={f.role} onChange={set("role")}>
              {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label>Branch</label>
            <select value={f.branch} onChange={set("branch")}>
              <option value="">— No branch —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.city ? ` (${b.city})` : ""}</option>)}
            </select>
          </div>
          <div className="span2"><label>Phone</label><input value={f.phone} onChange={set("phone")} /></div>
          <div className="span2 form-actions"><button className="btn primary">Create staff & generate matricule</button></div>
        </form>
      )}

      <table className="table">
        <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Matricule</th><th>Status</th></tr></thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id}>
              <td>{s.full_name}</td>
              <td>{s.role_display}</td>
              <td>{s.branch_name || "—"}</td>
              <td><code>{s.matricule || "—"}</code></td>
              <td><span className={`pill ${s.activated ? "ok" : "partial"}`}>{s.activated ? "Active" : "Pending activation"}</span></td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={5} className="muted">No staff yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
