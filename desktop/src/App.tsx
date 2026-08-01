import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { useAuth } from "./lib/auth";
import Appointments from "./pages/Appointments";
import Branches from "./pages/Branches";
import Dashboard from "./pages/Dashboard";
import Laboratory from "./pages/Laboratory";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Pharmacies from "./pages/Pharmacies";
import Pharmacy from "./pages/Pharmacy";
import RxQueue from "./pages/RxQueue";
import Schedule from "./pages/Schedule";
import Staff from "./pages/Staff";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/laboratory" element={<Laboratory />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/rx-queue" element={<RxQueue />} />
        <Route path="/pharmacies" element={<Pharmacies />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
