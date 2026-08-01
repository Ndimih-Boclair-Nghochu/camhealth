import { useEffect, useState } from "react";
import type { AvailabilitySlot, Paginated } from "@camhealth/shared";

import { api } from "../lib/api";

export default function Schedule() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [show, setShow] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [duration, setDuration] = useState("30");

  async function load() {
    const { data } = await api.get<Paginated<AvailabilitySlot>>("/availability/");
    setSlots(data.results);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    await api.post("/availability/", {
      starts_at: new Date(startsAt).toISOString(),
      capacity: Number(capacity),
      duration_minutes: Number(duration),
    });
    setStartsAt("");
    setShow(false);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Appointment timetable</h1>
        <button className="btn primary" onClick={() => setShow((s) => !s)}>{show ? "Close" : "+ Open a slot"}</button>
      </div>
      <p className="muted">Patients can only book the slots you open here.</p>

      {show && (
        <form className="card form-grid" onSubmit={add}>
          <div className="span2"><label>Date &amp; time *</label><input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
          <div><label>Capacity</label><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
          <div><label>Duration (min)</label><input type="number" min={5} value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          <div className="span2 form-actions"><button className="btn primary">Open slot</button></div>
        </form>
      )}

      <table className="table">
        <thead><tr><th>When</th><th>Duration</th><th>Booked</th><th>Status</th></tr></thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.starts_at).toLocaleString()}</td>
              <td>{s.duration_minutes} min</td>
              <td>{s.booked_count} / {s.capacity}</td>
              <td><span className={`pill ${s.is_open ? "ok" : "partial"}`}>{s.is_open ? "Open" : "Full / past"}</span></td>
            </tr>
          ))}
          {slots.length === 0 && <tr><td colSpan={4} className="muted">No slots opened yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
