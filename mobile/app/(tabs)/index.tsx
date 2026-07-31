import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card, Empty, Pill, StatCard } from "../../components/ui";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius } from "../../lib/theme";
import type { Appointment, Drug, Paginated, Patient } from "../../lib/types";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [patients, setPatients] = useState(0);
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<Drug[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, q, a] = await Promise.all([
        api.get<Paginated<Patient>>("/patients/"),
        api.get<Appointment[]>("/appointments/queue/"),
        api.get<Drug[]>("/drugs/alerts/"),
      ]);
      setPatients(p.data.count);
      setQueue(q.data);
      setAlerts(a.data);
    } catch {
      /* handled by empty states */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.full_name || user?.username}</Text>
          </View>
          <Avatar name={user?.full_name || "?"} color={colors.tealBright} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: -40 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatCard label="Patients" value={patients} icon="people" tint={colors.teal} />
          <StatCard label="In queue" value={queue.length} icon="time" tint="#3b82f6" />
          <StatCard label="Stock alerts" value={alerts.length} icon="warning" tint={colors.warn} />
        </View>

        <Text style={styles.section}>Today's queue</Text>
        {queue.length === 0 ? (
          <Card><Empty icon="checkmark-done-outline" text="No one waiting right now." /></Card>
        ) : (
          queue.map((a, i) => (
            <Card key={a.id} style={styles.queueRow}>
              <View style={styles.queueNo}><Text style={styles.queueNoText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{a.patient_name}</Text>
                <Text style={styles.rowSub}>{a.reason || a.patient_code}</Text>
              </View>
              <Pill label={a.status_display} tone={a.status === "IN_CONSULTATION" ? "info" : "warn"} />
            </Card>
          ))
        )}

        {alerts.length > 0 && (
          <>
            <Text style={styles.section}>Stock alerts</Text>
            {alerts.map((d) => (
              <Card key={d.id} style={styles.queueRow}>
                <View style={[styles.iconDot, { backgroundColor: d.stock_status === "OUT" ? colors.dangerBg : colors.warnBg }]}>
                  <Ionicons name="medkit" size={16} color={d.stock_status === "OUT" ? colors.danger : colors.warn} />
                </View>
                <Text style={[styles.rowTitle, { flex: 1 }]}>{d.name}</Text>
                <Pill label={`${d.stock_status} · ${d.stock_quantity}`} tone={d.stock_status === "OUT" ? "danger" : "warn"} />
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 54,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  greeting: { color: "#9fb4c9", fontSize: 14 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  queueRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, paddingVertical: 14 },
  queueNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  queueNoText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  iconDot: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  rowSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
