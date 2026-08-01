import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card } from "../../components/ui";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius, shadow } from "../../lib/theme";
import type { Appointment, HospitalPost } from "../../lib/types";

const QUICK = [
  { label: "Book visit", icon: "calendar", tint: "#3b82f6", href: "/(patient)/care" },
  { label: "Pharmacy", icon: "cart", tint: "#e0803a", href: "/(patient)/pharmacy" },
  { label: "My records", icon: "folder-open", tint: "#1d6f6b", href: "/(patient)/records" },
  { label: "Symptom check", icon: "pulse", tint: "#8b5cf6", href: "/(patient)/care" },
] as const;

const CAT_TONE: Record<string, string> = { ALERT: colors.danger, CAMPAIGN: "#8b5cf6", TIP: colors.ok, NEWS: colors.teal };

export default function PatientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [next, setNext] = useState<Appointment | null>(null);
  const [feed, setFeed] = useState<HospitalPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [appts, posts] = await Promise.all([
        api.get<Appointment[]>("/me/appointments/"),
        api.get<{ results: HospitalPost[] }>("/posts/"),
      ]);
      const upcoming = appts.data
        .filter((a) => ["BOOKED", "WAITING", "IN_CONSULTATION"].includes(a.status))
        .sort((a, b) => +new Date(a.scheduled_for) - +new Date(b.scheduled_for));
      setNext(upcoming[0] ?? null);
      setFeed(posts.data.results);
    } catch {
      /* empty states handle it */
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

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
        style={{ flex: 1, marginTop: -34 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        <Card style={styles.quickCard}>
          {QUICK.map((q) => (
            <Pressable key={q.label} style={styles.quick} onPress={() => router.push(q.href as any)}>
              <View style={[styles.quickIcon, { backgroundColor: q.tint + "1e" }]}>
                <Ionicons name={q.icon as any} size={22} color={q.tint} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </Card>

        <Text style={styles.section}>Upcoming visit</Text>
        {next ? (
          <Card style={styles.apptCard}>
            <View style={styles.apptDate}>
              <Text style={styles.apptDay}>{new Date(next.scheduled_for).getDate()}</Text>
              <Text style={styles.apptMon}>{new Date(next.scheduled_for).toLocaleString("en", { month: "short" })}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.apptTitle}>{next.reason || "Appointment"}</Text>
              <Text style={styles.apptSub}>
                {new Date(next.scheduled_for).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {next.status_display}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        ) : (
          <Pressable onPress={() => router.push("/(patient)/care")}>
            <Card style={styles.emptyAppt}>
              <Ionicons name="add-circle" size={22} color={colors.teal} />
              <Text style={{ color: colors.teal, fontWeight: "700" }}>Book an appointment</Text>
            </Card>
          </Pressable>
        )}

        <Text style={styles.section}>From your hospital</Text>
        {feed.length === 0 ? (
          <Card><Text style={{ color: colors.muted }}>No posts yet.</Text></Card>
        ) : (
          feed.map((p) => (
            <Card key={p.id} style={{ marginBottom: 12 }}>
              <View style={styles.postHead}>
                <View style={[styles.catDot, { backgroundColor: (CAT_TONE[p.category] || colors.teal) + "22" }]}>
                  <Ionicons name="megaphone" size={14} color={CAT_TONE[p.category] || colors.teal} />
                </View>
                <Text style={[styles.cat, { color: CAT_TONE[p.category] || colors.teal }]}>{p.category_display}</Text>
                <Text style={styles.postDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={styles.postBody} numberOfLines={3}>{p.body}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 46, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  greeting: { color: "#9fb4c9", fontSize: 14 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  quickCard: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16 },
  quick: { alignItems: "center", gap: 8, width: "23%" },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11.5, color: colors.sub, fontWeight: "600", textAlign: "center" },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  apptCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  apptDate: { width: 54, height: 54, borderRadius: 14, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  apptDay: { color: "#fff", fontSize: 20, fontWeight: "800" },
  apptMon: { color: "#9fb4c9", fontSize: 11, textTransform: "uppercase" },
  apptTitle: { fontSize: 15.5, fontWeight: "700", color: colors.ink },
  apptSub: { fontSize: 12.5, color: colors.muted, marginTop: 3 },
  emptyAppt: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  catDot: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cat: { fontSize: 11.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, flex: 1 },
  postDate: { fontSize: 11.5, color: colors.muted },
  postTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  postBody: { fontSize: 13.5, color: colors.sub, marginTop: 4, lineHeight: 19 },
});
