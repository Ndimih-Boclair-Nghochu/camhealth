import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card, SectionTitle } from "../../components/ui";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, fs, radius, s, shadow, spacing } from "../../lib/theme";
import type { Appointment, HospitalPost } from "../../lib/types";

const QUICK = [
  { label: "Book visit", icon: "calendar", tint: "#3b82f6", href: "/(patient)/care" },
  { label: "Pharmacy", icon: "cart", tint: "#e0803a", href: "/(patient)/pharmacy" },
  { label: "Records", icon: "folder-open", tint: "#1d6f6b", href: "/(patient)/records" },
  { label: "Symptoms", icon: "pulse", tint: "#8b5cf6", href: "/(patient)/symptom" },
  { label: "Directions", icon: "navigate", tint: "#0ea5a4", href: "/(patient)/directions" },
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
    } catch { /* empty states handle it */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + s(14) }]}>
        <View style={styles.glow} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name} numberOfLines={1}>{user?.full_name || user?.username}</Text>
          </View>
          <Pressable onPress={() => router.push("/(patient)/profile")}>
            <Avatar name={user?.full_name || "?"} size={s(46)} color={colors.tealBright} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: -s(30) }}
        contentContainerStyle={{ paddingBottom: s(28) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        {/* Quick actions — horizontal, responsive */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: s(12) }}
        >
          {QUICK.map((q) => (
            <Pressable key={q.label} style={styles.quick} onPress={() => router.push(q.href as any)}>
              <View style={[styles.quickIcon, { backgroundColor: q.tint + "1e" }]}>
                <Ionicons name={q.icon as any} size={fs(23)} color={q.tint} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>{q.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.md }}>
          <SectionTitle style={{ marginTop: s(22) }}>Upcoming visit</SectionTitle>
          {next ? (
            <Card onPress={() => router.push("/(patient)/care")} style={styles.apptCard}>
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
              <Ionicons name="chevron-forward" size={fs(18)} color={colors.muted} />
            </Card>
          ) : (
            <Card onPress={() => router.push("/(patient)/care")} style={styles.emptyAppt}>
              <Ionicons name="add-circle" size={fs(22)} color={colors.teal} />
              <Text style={{ color: colors.teal, fontWeight: "700", fontSize: fs(14.5) }}>Book an appointment</Text>
            </Card>
          )}

          <SectionTitle style={{ marginTop: s(24) }}>From your hospital</SectionTitle>
          {feed.length === 0 ? (
            <Card><Text style={{ color: colors.muted }}>No posts yet.</Text></Card>
          ) : (
            feed.map((p) => (
              <Card key={p.id} style={{ marginBottom: s(12) }}>
                <View style={styles.postHead}>
                  <View style={[styles.catDot, { backgroundColor: (CAT_TONE[p.category] || colors.teal) + "22" }]}>
                    <Ionicons name="megaphone" size={fs(14)} color={CAT_TONE[p.category] || colors.teal} />
                  </View>
                  <Text style={[styles.cat, { color: CAT_TONE[p.category] || colors.teal }]}>{p.category_display}</Text>
                  <Text style={styles.postDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.postTitle}>{p.title}</Text>
                <Text style={styles.postBody} numberOfLines={3}>{p.body}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: s(44),
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, overflow: "hidden",
  },
  glow: { position: "absolute", top: -s(70), right: -s(60), width: s(200), height: s(200), borderRadius: s(100), backgroundColor: colors.teal, opacity: 0.28 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  greeting: { color: "#9fb4c9", fontSize: fs(14) },
  name: { color: "#fff", fontSize: fs(23), fontWeight: "800", marginTop: s(2) },
  quick: { alignItems: "center", gap: s(7), width: s(70) },
  quickIcon: { width: s(58), height: s(58), borderRadius: radius.md, alignItems: "center", justifyContent: "center", ...shadow.soft, backgroundColor: colors.card },
  quickLabel: { fontSize: fs(11.5), color: colors.sub, fontWeight: "600", textAlign: "center" },
  apptCard: { flexDirection: "row", alignItems: "center", gap: s(14) },
  apptDate: { width: s(54), height: s(54), borderRadius: radius.md, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  apptDay: { color: "#fff", fontSize: fs(20), fontWeight: "800" },
  apptMon: { color: "#9fb4c9", fontSize: fs(11), textTransform: "uppercase" },
  apptTitle: { fontSize: fs(15.5), fontWeight: "700", color: colors.ink },
  apptSub: { fontSize: fs(12.5), color: colors.muted, marginTop: s(3) },
  emptyAppt: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: s(8) },
  postHead: { flexDirection: "row", alignItems: "center", gap: s(8), marginBottom: s(8) },
  catDot: { width: s(26), height: s(26), borderRadius: s(8), alignItems: "center", justifyContent: "center" },
  cat: { fontSize: fs(11.5), fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, flex: 1 },
  postDate: { fontSize: fs(11.5), color: colors.muted },
  postTitle: { fontSize: fs(16), fontWeight: "800", color: colors.ink },
  postBody: { fontSize: fs(13.5), color: colors.sub, marginTop: s(4), lineHeight: fs(19) },
});
