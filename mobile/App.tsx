import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

/**
 * CamHealth companion app (Phase 2). Clinicians review patients on rounds and
 * patients book appointments / view results. This is the starting shell — it
 * will consume the same API and shared types as the desktop app.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <Text style={styles.mark}>C</Text>
        <Text style={styles.name}>CamHealth</Text>
      </View>
      <Text style={styles.tagline}>Hospital Management System</Text>
      <Text style={styles.sub}>Companion app · by NBN TECH</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f2942", alignItems: "center", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: {
    width: 44, height: 44, borderRadius: 11, backgroundColor: "#fff", color: "#0f2942",
    fontWeight: "800", fontSize: 24, textAlign: "center", lineHeight: 44,
  },
  name: { color: "#fff", fontSize: 26, fontWeight: "700" },
  tagline: { color: "#cfe0ee", marginTop: 14, fontSize: 15 },
  sub: { color: "#7f93a8", marginTop: 6, fontSize: 12, letterSpacing: 1 },
});
