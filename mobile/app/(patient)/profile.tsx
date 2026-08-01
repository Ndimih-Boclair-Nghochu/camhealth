import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card } from "../../components/ui";
import { getOrigin } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius, shadow } from "../../lib/theme";

const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string; note: string }[] = [
  { icon: "people-outline", label: "Family & dependents", note: "Manage children and relatives" },
  { icon: "card-outline", label: "Payments & wallet", note: "Mobile Money, receipts" },
  { icon: "notifications-outline", label: "Reminders", note: "Medication & appointment alerts" },
  { icon: "call-outline", label: "Emergency & ambulance", note: "Quick help when it matters" },
];

export default function PatientProfile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState("");

  useEffect(() => { getOrigin().then(setOrigin); }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Avatar name={user?.full_name || "?"} size={72} color={colors.tealBright} />
        <Text style={styles.name}>{user?.full_name || user?.username}</Text>
        <Text style={styles.role}>Patient account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} style={{ marginTop: -22 }}>
        <Card style={styles.member}>
          <View style={styles.memberTop}>
            <Ionicons name="star" size={18} color="#e0a83a" />
            <Text style={styles.memberTitle}>CamHealth+ Membership</Text>
          </View>
          <Text style={styles.memberDesc}>Priority booking, free delivery, discounts on consultations and medicines.</Text>
          <Pressable style={styles.memberBtn}><Text style={styles.memberBtnText}>Upgrade — 2,000 FCFA/mo</Text></Pressable>
        </Card>

        <Card style={{ padding: 6 }}>
          {MENU.map((m, i) => (
            <View key={m.label}>
              <Pressable style={styles.menuRow}>
                <View style={styles.menuIcon}><Ionicons name={m.icon} size={18} color={colors.teal} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{m.label}</Text>
                  <Text style={styles.menuNote}>{m.note}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
              {i < MENU.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <Pressable onPress={handleSignOut} style={styles.signout}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={styles.signoutText}>Sign out</Text>
        </Pressable>
        <Text style={styles.footer}>CamHealth · v1.0.0 · {origin}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, alignItems: "center", paddingBottom: 42, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  name: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 12 },
  role: { color: "#9fb4c9", fontSize: 13, marginTop: 3 },
  member: { marginBottom: 14, backgroundColor: "#0f2942" },
  memberTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  memberDesc: { color: "#c3d3e2", fontSize: 13, marginTop: 8, lineHeight: 19 },
  memberBtn: { backgroundColor: colors.tealBright, borderRadius: 12, paddingVertical: 11, alignItems: "center", marginTop: 14 },
  memberBtnText: { color: "#04211f", fontWeight: "800" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.okBg, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "700", color: colors.ink },
  menuNote: { fontSize: 12, color: colors.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 60 },
  signout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.dangerBg, height: 52, borderRadius: 16, marginTop: 14 },
  signoutText: { color: colors.danger, fontWeight: "800", fontSize: 15 },
  footer: { textAlign: "center", color: colors.muted, fontSize: 11.5, marginTop: 12 },
});
