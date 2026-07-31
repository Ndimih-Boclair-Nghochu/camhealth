import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card } from "../../components/ui";
import { getOrigin } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    getOrigin().then(setOrigin);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Avatar name={user?.full_name || "?"} size={72} color={colors.tealBright} />
        <Text style={styles.name}>{user?.full_name || user?.username}</Text>
        <Text style={styles.role}>{user?.role_display}</Text>
      </View>

      <View style={{ padding: 18, gap: 12, marginTop: -26 }}>
        <Card>
          <InfoRow icon="person-outline" label="Username" value={user?.username || "—"} />
          <Divider />
          <InfoRow icon="shield-checkmark-outline" label="Role" value={user?.role_display || "—"} />
          <Divider />
          <InfoRow icon="server-outline" label="Server" value={origin} />
        </Card>

        <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.signout, pressed && { opacity: 0.9 }]}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={styles.signoutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>CamHealth · v1.0.0 · by NBN TECH</Text>
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={colors.teal} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const Divider = () => <View style={{ height: 1, backgroundColor: colors.line, marginLeft: 46 }} />;

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy, alignItems: "center", paddingBottom: 46,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  name: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 12 },
  role: { color: "#9fb4c9", fontSize: 13, marginTop: 3 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.okBg, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 12, color: colors.muted },
  infoValue: { fontSize: 15, color: colors.ink, fontWeight: "600", marginTop: 1 },
  signout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.dangerBg, height: 52, borderRadius: 16,
  },
  signoutText: { color: colors.danger, fontWeight: "800", fontSize: 15 },
  footer: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 6 },
});
