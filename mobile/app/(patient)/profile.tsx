import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card } from "../../components/ui";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius, shadow } from "../../lib/theme";
import type { Patient } from "../../lib/types";

export default function PatientProfile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Patient | null>(null);

  async function load() {
    try {
      const { data } = await api.get<Patient>("/me/profile/");
      setProfile(data);
    } catch { /* ignore */ }
  }
  useEffect(() => { load(); }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string; note: string; onPress: () => void }[] = [
    { icon: "create-outline", label: "Edit profile", note: "Name, contact, health details", onPress: () => router.push("/(patient)/edit-profile") },
    { icon: "calendar-outline", label: "My appointments", note: "Upcoming and past visits", onPress: () => router.push("/(patient)/care") },
    { icon: "bag-handle-outline", label: "My pharmacy orders", note: "Track medicine orders", onPress: () => router.push("/(patient)/pharmacy") },
    { icon: "sparkles-outline", label: "Symptom checker", note: "Get quick AI guidance", onPress: () => router.push("/(patient)/symptom") },
    { icon: "help-circle-outline", label: "Help & support", note: "Contact the CamHealth team", onPress: () => Linking.openURL("mailto:ndimihboclair4@gmail.com?subject=CamHealth%20support") },
  ];

  const name = profile ? profile.full_name : user?.full_name || user?.username;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Avatar name={name || "?"} size={72} color={colors.tealBright} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{profile ? profile.patient_code : "Patient account"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} style={{ marginTop: -22 }}>
        <Card style={styles.member}>
          <View style={styles.memberTop}>
            <Ionicons name="star" size={18} color="#e0a83a" />
            <Text style={styles.memberTitle}>CamHealth+ Membership</Text>
          </View>
          <Text style={styles.memberDesc}>Priority booking, free delivery, discounts on consultations and medicines.</Text>
          <Pressable
            style={styles.memberBtn}
            onPress={() => Alert.alert("CamHealth+", "Membership launches soon — you'll get priority booking, free medicine delivery and discounts for 2,000 FCFA/month.")}
          >
            <Text style={styles.memberBtnText}>Upgrade — 2,000 FCFA/mo</Text>
          </Pressable>
        </Card>

        <Card style={{ padding: 6 }}>
          {MENU.map((m, i) => (
            <View key={m.label}>
              <Pressable style={styles.menuRow} onPress={m.onPress}>
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
        <Text style={styles.footer}>CamHealth · v1.0.0 · by NBN TECH</Text>
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
