import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { useAuth } from "./lib/auth";
import Appointments from "./pages/Appointments";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PatientDetail from "./pages/PatientDetail";
import Patients from "./pages/Patients";
import Pharmacy from "./pages/Pharmacy";

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
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
