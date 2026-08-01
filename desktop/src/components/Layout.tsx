import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../lib/auth";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span className="brand-name">
            CamHealth<small>NBN TECH</small>
          </span>
        </div>
        <nav>
          <NavLink to="/" end className="nav-item">
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/patients" className="nav-item">
            <span>Patients</span>
          </NavLink>
          <NavLink to="/appointments" className="nav-item">
            <span>Appointments</span>
          </NavLink>
          <NavLink to="/laboratory" className="nav-item">
            <span>Laboratory</span>
          </NavLink>
          <NavLink to="/pharmacy" className="nav-item">
            <span>Pharmacy</span>
          </NavLink>
          <NavLink to="/rx-queue" className="nav-item">
            <span>Rx Prep Queue</span>
          </NavLink>
          <NavLink to="/pharmacies" className="nav-item">
            <span>Pharmacy Branches</span>
          </NavLink>
          <NavLink to="/schedule" className="nav-item">
            <span>Timetable</span>
          </NavLink>
          <NavLink to="/staff" className="nav-item">
            <span>Staff</span>
          </NavLink>
          <NavLink to="/branches" className="nav-item">
            <span>Branches</span>
          </NavLink>
        </nav>
        <div className="sidebar-foot muted">Phase 1 · v1.0.0</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="muted">Hospital Management System</div>
          <div className="user">
            <div className="user-info">
              <strong>{user?.full_name}</strong>
              <span className="muted">{user?.role_display}</span>
            </div>
            <button className="btn ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
