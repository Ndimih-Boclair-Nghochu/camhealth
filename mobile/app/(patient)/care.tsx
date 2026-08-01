import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Empty, Loader, Pill } from "../../components/ui";
import { TextField } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import type { Appointment, AvailabilitySlot, Paginated } from "../../lib/types";

const TONE: Record<string, "ok" | "warn" | "info" | "danger" | "neutral"> = {
  BOOKED: "info", WAITING: "warn", IN_CONSULTATION: "info", DONE: "ok", CANCELLED: "danger",
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export default function Care() {
  const insets = useSafeAreaInsets();
  const [appts, setAppts] = useState<Appointment[] | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const [a, s] = await Promise.all([
      api.get<Appointment[]>("/me/appointments/"),
      api.get<Paginated<AvailabilitySlot>>("/availability/"),
    ]);
    setAppts(a.data);
    setSlots(s.data.results);
  }
  useEffect(() => { load(); }, []);

  async function book() {
    if (!selected) { setMsg("Pick an available time first."); return; }
    setMsg(""); setBusy(true);
    try {
      await api.post("/me/appointments/", { slot: selected, reason });
      setReason(""); setSelected(null);
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Could not book. Try another time.");
    } finally { setBusy(false); }
  }

  // group slots by day
  const grouped: Record<string, AvailabilitySlot[]> = {};
  for (const s of slots) (grouped[dayLabel(s.starts_at)] ||= []).push(s);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Care</Text>
        <Text style={styles.subtitle}>Book from the hospital's available times</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <Text style={styles.cardTitle}>Request an appointment</Text>
          <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. Fever, follow-up, antenatal" />

          <Text style={styles.label}>Available times</Text>
          {slots.length === 0 ? (
            <Text style={styles.none}>No open slots right now. Please check back later.</Text>
          ) : (
            Object.entries(grouped).map(([day, list]) => (
              <View key={day} style={{ marginBottom: 10 }}>
                <Text style={styles.day}>{day}</Text>
                <View style={styles.slotWrap}>
                  {list.map((s) => {
                    const on = selected === s.id;
                    return (
                      <Pressable key={s.id} onPress={() => setSelected(s.id)} style={[styles.slot, on && styles.slotOn]}>
                        <Text style={[styles.slotText, on && styles.slotTextOn]}>
                          {new Date(s.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          {!!msg && <Text style={styles.err}>{msg}</Text>}
          <Button label="Book appointment" icon="calendar-outline" onPress={book} loading={busy} />
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
                <Text style={styles.dnum}>{new Date(a.scheduled_for).getDate()}</Text>
                <Text style={styles.dmon}>{new Date(a.scheduled_for).toLocaleString("en", { month: "short" })}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aReason}>{a.reason || "Appointment"}</Text>
                <Text style={styles.aTime}>{new Date(a.scheduled_for).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</Text>
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
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginTop: 4 },
  none: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  day: { fontSize: 12.5, fontWeight: "800", color: colors.navy2, marginBottom: 6 },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { borderWidth: 1.4, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: colors.card },
  slotOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  slotText: { color: colors.sub, fontWeight: "700", fontSize: 13 },
  slotTextOn: { color: "#fff" },
  err: { color: colors.danger, fontSize: 13, marginVertical: 8 },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  apptRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  dateBox: { width: 50, height: 50, borderRadius: 13, backgroundColor: "#eef2f6", alignItems: "center", justifyContent: "center" },
  dnum: { fontSize: 18, fontWeight: "800", color: colors.navy },
  dmon: { fontSize: 10.5, color: colors.muted, textTransform: "uppercase" },
  aReason: { fontSize: 15, fontWeight: "700", color: colors.ink },
  aTime: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
