import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "../../lib/theme";

type Service = {
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  href: string;
};

const SERVICES: Service[] = [
  { label: "Register patient", desc: "New patient file + ID", icon: "person-add", tint: "#1d6f6b", href: "/patient/new" },
  { label: "Appointments", desc: "Book & manage queue", icon: "calendar", tint: "#3b82f6", href: "/appointments" },
  { label: "Consultation", desc: "Notes & e-prescription", icon: "document-text", tint: "#8b5cf6", href: "/consultation/new" },
  { label: "Laboratory", desc: "Orders & results", icon: "flask", tint: "#0ea5a4", href: "/laboratory" },
  { label: "Pharmacy", desc: "Stock & dispensing", icon: "medkit", tint: "#e0803a", href: "/pharmacy" },
  { label: "Billing", desc: "Invoices & payments", icon: "cash", tint: "#16a34a", href: "/billing" },
  { label: "Staff on-site", desc: "Locate colleagues at work", icon: "navigate", tint: "#0ea5a4", href: "/staff-map" },
];

export default function Services() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Everything your facility needs, in one place</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => router.push(s.href as any)}
              style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: s.tint + "1e" }]}>
                <Ionicons name={s.icon} size={24} color={s.tint} />
              </View>
              <Text style={styles.tileLabel}>{s.label}</Text>
              <Text style={styles.tileDesc}>{s.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 22,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#9fb4c9", fontSize: 13, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: {
    width: "48%", backgroundColor: colors.card, borderRadius: radius.md, padding: 16,
    marginBottom: 14, ...shadow.card,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileLabel: { fontSize: 15.5, fontWeight: "800", color: colors.ink },
  tileDesc: { fontSize: 12.5, color: colors.muted, marginTop: 3 },
});
