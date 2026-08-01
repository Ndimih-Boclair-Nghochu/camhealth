import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Card, Empty, Loader, Pill } from "../components/ui";
import { PatientSelect, ScreenHeader, TextField } from "../components/kit";
import { api } from "../lib/api";
import { colors } from "../lib/theme";
import type { Appointment, Patient } from "../lib/types";

const NEXT: Record<string, { to: string; label: string }> = {
  BOOKED: { to: "WAITING", label: "Check in" },
  WAITING: { to: "IN_CONSULTATION", label: "Start" },
  IN_CONSULTATION: { to: "DONE", label: "Complete" },
};

export default function Appointments() {
  const [queue, setQueue] = useState<Appointment[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get<Appointment[]>("/appointments/queue/");
    setQueue(data);
  }
  useEffect(() => { load(); }, []);

  async function book() {
    if (!patient) return;
    setBusy(true);
    try {
      await api.post("/appointments/", {
        patient: patient.id, scheduled_for: new Date().toISOString(),
        reason, status: "WAITING",
      });
      setPatient(null); setReason(""); setShowForm(false);
      await load();
    } finally { setBusy(false); }
  }

  async function advance(a: Appointment, to: string) {
    await api.patch(`/appointments/${a.id}/`, { status: to });
    load();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Appointments" subtitle="Today's queue" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Button
          label={showForm ? "Close" : "＋ Add to queue"}
          variant={showForm ? "ghost" : "primary"}
          onPress={() => setShowForm((s) => !s)}
        />

        {showForm && (
          <Card style={{ marginTop: 14 }}>
            <PatientSelect value={patient} onChange={setPatient} />
            <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. Fever" />
            <Button label="Add to queue" icon="add-circle-outline" onPress={book} loading={busy} />
          </Card>
        )}

        <Text style={styles.section}>In queue</Text>
        {queue === null ? (
          <Loader />
        ) : queue.length === 0 ? (
          <Card><Empty icon="checkmark-done-outline" text="No one waiting." /></Card>
        ) : (
          queue.map((a, i) => {
            const next = NEXT[a.status];
            return (
              <Card key={a.id} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={styles.no}><Text style={styles.noText}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{a.patient_name}</Text>
                    <Text style={styles.sub}>{a.reason || a.patient_code}</Text>
                  </View>
                  <Pill label={a.status_display} tone={a.status === "IN_CONSULTATION" ? "info" : "warn"} />
                </View>
                <View style={styles.actions}>
                  {next && <View style={{ flex: 1 }}><Button label={next.label} onPress={() => advance(a, next.to)} /></View>}
                  <View style={{ flex: 1 }}><Button label="Cancel" variant="ghost" onPress={() => advance(a, "CANCELLED")} /></View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  no: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  noText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  name: { fontSize: 15, fontWeight: "700", color: colors.ink },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
});
