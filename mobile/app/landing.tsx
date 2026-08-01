import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "../components/Logo";
import { colors, radius, shadow } from "../lib/theme";

const POINTS: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { icon: "calendar", title: "Book care in seconds", sub: "Doctors, consultations and video visits" },
  { icon: "cart", title: "Pharmacy to your door", sub: "Order medicines, pay with Mobile Money" },
  { icon: "folder-open", title: "Your records, always", sub: "Visits, prescriptions and lab results" },
];

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <View style={[styles.top, { paddingTop: insets.top + 40 }]}>
        <Logo size={96} />
        <Text style={styles.brand}>CamHealth</Text>
        <Text style={styles.tagline}>Your hospital, in your pocket.</Text>
      </View>

      <View style={styles.card}>
        {POINTS.map((p, i) => (
          <View key={p.title} style={[styles.point, i < POINTS.length - 1 && styles.pointDivider]}>
            <View style={styles.pIcon}>
              <Ionicons name={p.icon} size={20} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pTitle}>{p.title}</Text>
              <Text style={styles.pSub}>{p.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={() => router.push("/register")} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
          <Text style={styles.ctaText}>Get started</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/login")} style={styles.signin}>
          <Text style={styles.signinText}>
            I already have an account <Text style={{ color: colors.tealBright, fontWeight: "800" }}>Sign in</Text>
          </Text>
        </Pressable>
        <Text style={styles.legal}>By continuing you agree to our Terms & Privacy Policy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy, overflow: "hidden" },
  glowA: { position: "absolute", top: -80, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: "#1d6f6b", opacity: 0.35 },
  glowB: { position: "absolute", bottom: 120, left: -90, width: 240, height: 240, borderRadius: 120, backgroundColor: "#22b8ad", opacity: 0.18 },
  top: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  brand: { color: "#fff", fontSize: 34, fontWeight: "900", letterSpacing: 0.3, marginTop: 18 },
  tagline: { color: "#a9bccd", fontSize: 16, marginTop: 8 },
  card: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", borderWidth: 1, marginHorizontal: 20, borderRadius: radius.lg, padding: 8 },
  point: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  pointDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  pIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  pTitle: { color: "#fff", fontSize: 15.5, fontWeight: "700" },
  pSub: { color: "#9fb4c9", fontSize: 12.5, marginTop: 2 },
  actions: { paddingHorizontal: 20, paddingTop: 22 },
  cta: { backgroundColor: colors.tealBright, height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center", ...shadow.card },
  ctaText: { color: "#04211f", fontWeight: "900", fontSize: 17 },
  signin: { alignItems: "center", paddingVertical: 16 },
  signinText: { color: "#c3d3e2", fontSize: 14.5 },
  legal: { color: "#6f8296", fontSize: 11.5, textAlign: "center", marginTop: 2 },
});
