import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Empty, Loader, Pill } from "../../components/ui";
import { TextField } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import type { Appointment } from "../../lib/types";

const SLOTS = ["Today", "Tomorrow", "In 3 days", "Next week"];
function slotToDate(i: number) {
  const d = new Date();
  d.setDate(d.getDate() + [0, 1, 3, 7][i]);
  d.setHours(9, 0, 0, 0);
  return d;
}

const TONE: Record<string, "ok" | "warn" | "info" | "danger" | "neutral"> = {
  BOOKED: "info", WAITING: "warn", IN_CONSULTATION: "info", DONE: "ok", CANCELLED: "danger",
};

export default function Care() {
  const insets = useSafeAreaInsets();
  const [appts, setAppts] = useState<Appointment[] | null>(null);
  const [reason, setReason] = useState("");
  const [slot, setSlot] = useState(0);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get<Appointment[]>("/me/appointments/");
    setAppts(data);
  }
  useEffect(() => { load(); }, []);

  async function book() {
    setBusy(true);
    try {
      await api.post("/me/appointments/", { scheduled_for: slotToDate(slot).toISOString(), reason });
      setReason("");
      await load();
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Care</Text>
        <Text style={styles.subtitle}>Book a consultation or video visit</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <Text style={styles.cardTitle}>Request an appointment</Text>
          <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. Fever, follow-up, antenatal" />
          <Text style={styles.label}>Preferred time</Text>
          <View style={styles.slots}>
            {SLOTS.map((s, i) => (
              <Pressable key={s} onPress={() => setSlot(i)} style={[styles.slot, slot === i && styles.slotOn]}>
                <Text style={[styles.slotText, slot === i && styles.slotTextOn]}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Book appointment" icon="calendar-outline" onPress={book} loading={busy} />
          <Text style={styles.hint}>The hospital confirms your slot and notifies you.</Text>
        </Card>

        <Text style={styles.section}>My appointments</Text>
        {appts === null ? (
          <Loader />
        ) : appts.length === 0 ? (
          <Card><Empty icon="calendar-outline" text="No appointments yet." /></Card>
        ) : (
          appts.map((a) => (
            <Card key={a.id} style={styles.apptRow}>
              <View style={styles.dateBox}>
                <Text style={styles.day}>{new Date(a.scheduled_for).getDate()}</Text>
                <Text style={styles.mon}>{new Date(a.scheduled_for).toLocaleString("en", { month: "short" })}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reason}>{a.reason || "Appointment"}</Text>
                <Text style={styles.time}>{new Date(a.scheduled_for).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
              <Pill label={a.status_display} tone={TONE[a.status] || "neutral"} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#9fb4c9", fontSize: 13, marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, marginBottom: 12 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  slot: { borderWidth: 1.4, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 15, backgroundColor: colors.card },
  slotOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  slotText: { color: colors.sub, fontWeight: "600", fontSize: 13 },
  slotTextOn: { color: "#fff" },
  hint: { color: colors.muted, fontSize: 12, marginTop: 10, textAlign: "center" },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  apptRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  dateBox: { width: 50, height: 50, borderRadius: 13, backgroundColor: "#eef2f6", alignItems: "center", justifyContent: "center" },
  day: { fontSize: 18, fontWeight: "800", color: colors.navy },
  mon: { fontSize: 10.5, color: colors.muted, textTransform: "uppercase" },
  reason: { fontSize: 15, fontWeight: "700", color: colors.ink },
  time: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
