import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Card } from "../../components/ui";
import { PatientSelect, ScreenHeader, TextField } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import type { Patient, PrescriptionItem } from "../../lib/types";

export default function NewConsultation() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patient?: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [f, setF] = useState({ complaint: "", diagnosis: "", temperature: "", blood_pressure: "", pulse: "", weight: "", notes: "" });
  const [rx, setRx] = useState<PrescriptionItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.patient) api.get<Patient>(`/patients/${params.patient}/`).then((r) => setPatient(r.data));
  }, [params.patient]);

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const setDrug = (i: number, k: keyof PrescriptionItem, v: string) => {
    const next = [...rx]; next[i] = { ...next[i], [k]: v }; setRx(next);
  };

  async function save() {
    if (!patient) { setError("Select a patient."); return; }
    if (!f.complaint) { setError("Enter the complaint."); return; }
    setError(""); setBusy(true);
    try {
      const { data: c } = await api.post("/consultations/", { patient: patient.id, ...f });
      const drugs = rx.filter((d) => d.drug_name.trim());
      if (drugs.length) {
        await api.post("/prescriptions/", { patient: patient.id, consultation: c.id, items: drugs });
      }
      router.replace(`/patient/${patient.id}`);
    } catch {
      setError("Could not save. Check the connection.");
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="New consultation" subtitle="Notes & e-prescription" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          {!params.patient && <PatientSelect value={patient} onChange={setPatient} />}
          {!!params.patient && patient && (
            <View style={styles.patientChip}>
              <Ionicons name="person" size={16} color={colors.teal} />
              <Text style={{ color: colors.ink, fontWeight: "700" }}>{patient.full_name} · {patient.patient_code}</Text>
            </View>
          )}

          <TextField label="Complaint" value={f.complaint} onChangeText={set("complaint")} />
          <TextField label="Diagnosis" value={f.diagnosis} onChangeText={set("diagnosis")} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><TextField label="Temp (°C)" value={f.temperature} onChangeText={set("temperature")} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><TextField label="BP" value={f.blood_pressure} onChangeText={set("blood_pressure")} placeholder="120/80" /></View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><TextField label="Pulse" value={f.pulse} onChangeText={set("pulse")} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><TextField label="Weight (kg)" value={f.weight} onChangeText={set("weight")} keyboardType="numeric" /></View>
          </View>

          <View style={styles.rxHead}>
            <Text style={styles.label}>Prescription</Text>
            <Pressable onPress={() => setRx([...rx, { drug_name: "", dosage: "", frequency: "", duration: "" }])}>
              <Text style={{ color: colors.teal, fontWeight: "700" }}>＋ Add drug</Text>
            </Pressable>
          </View>
          {rx.map((d, i) => (
            <View key={i} style={styles.rxRow}>
              <TextInput placeholder="Drug" placeholderTextColor={colors.muted} value={d.drug_name} onChangeText={(v) => setDrug(i, "drug_name", v)} style={[styles.inp, { flex: 2 }]} />
              <TextInput placeholder="Dosage" placeholderTextColor={colors.muted} value={d.dosage} onChangeText={(v) => setDrug(i, "dosage", v)} style={[styles.inp, { flex: 1 }]} />
              <TextInput placeholder="Freq" placeholderTextColor={colors.muted} value={d.frequency} onChangeText={(v) => setDrug(i, "frequency", v)} style={[styles.inp, { flex: 1 }]} />
            </View>
          ))}

          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={{ marginTop: 8 }}><Button label="Save consultation" icon="save-outline" onPress={save} loading={busy} /></View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.muted },
  patientChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.okBg, padding: 10, borderRadius: radius.sm, marginBottom: 14 },
  rxHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 8 },
  rxRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  inp: { backgroundColor: "#f4f7fa", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, height: 46, paddingHorizontal: 10, color: colors.ink },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
});
