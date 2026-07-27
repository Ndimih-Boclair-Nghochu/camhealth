import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sex, type Paginated, type Patient } from "@camhealth/shared";

import { api } from "../lib/api";

const EMPTY = {
  first_name: "",
  last_name: "",
  sex: Sex.MALE,
  date_of_birth: "",
  phone: "",
  address: "",
  blood_group: "",
  allergies: "",
  chronic_conditions: "",
};

export default function Patients() {
  const navigate = useNavigate();
  const [list, setList] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load(q = "") {
    const { data } = await api.get<Paginated<Patient>>("/patients/", {
      params: q ? { search: q } : {},
    });
    setList(data.results);
  }

  useEffect(() => {
    load();
  }, []);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, date_of_birth: form.date_of_birth || null };
      const { data } = await api.post<Patient>("/patients/", payload);
      setShowForm(false);
      setForm({ ...EMPTY });
      navigate(`/patients/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h1>Patients</h1>
        <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "+ Register patient"}
        </button>
      </div>

      {showForm && (
        <form className="card form-grid" onSubmit={register}>
          <div>
            <label>First name *</label>
            <input required value={form.first_name} onChange={set("first_name")} />
          </div>
          <div>
            <label>Last name *</label>
            <input required value={form.last_name} onChange={set("last_name")} />
          </div>
          <div>
            <label>Sex</label>
            <select value={form.sex} onChange={set("sex")}>
              <option value={Sex.MALE}>Male</option>
              <option value={Sex.FEMALE}>Female</option>
              <option value={Sex.OTHER}>Other</option>
            </select>
          </div>
          <div>
            <label>Date of birth</label>
            <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
          </div>
          <div>
            <label>Phone</label>
            <input value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label>Blood group</label>
            <input value={form.blood_group} onChange={set("blood_group")} placeholder="O+" />
          </div>
          <div className="span2">
            <label>Address</label>
            <input value={form.address} onChange={set("address")} />
          </div>
          <div className="span2">
            <label>Allergies</label>
            <input value={form.allergies} onChange={set("allergies")} />
          </div>
          <div className="span2 form-actions">
            <button className="btn primary" disabled={saving}>
              {saving ? "Saving…" : "Save & open file"}
            </button>
          </div>
        </form>
      )}

      <div className="searchbar">
        <input
          placeholder="Search by name, code or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
        />
        <button className="btn" onClick={() => load(search)}>
          Search
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Sex</th>
            <th>Age</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="clickable" onClick={() => navigate(`/patients/${p.id}`)}>
              <td>{p.patient_code}</td>
              <td>{p.full_name}</td>
              <td>{p.sex}</td>
              <td>{p.age ?? "—"}</td>
              <td>{p.phone || "—"}</td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No patients found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
