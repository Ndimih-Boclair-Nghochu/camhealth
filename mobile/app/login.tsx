import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEFAULT_ORIGIN, getOrigin, setOrigin } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radius, shadow } from "../lib/theme";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [origin, setOriginValue] = useState(DEFAULT_ORIGIN);
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOrigin().then(setOriginValue);
  }, []);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await setOrigin(origin);
      await signIn(username.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? "Incorrect username or password."
          : "Cannot reach the server. Check the address and Wi-Fi."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + 46 }]}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>C</Text>
          </View>
          <Text style={styles.brand}>CamHealth</Text>
          <Text style={styles.brandSub}>Hospital Management · NBN TECH</Text>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <Field icon="person-outline" placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          <Pressable onPress={() => setShowServer((s) => !s)} style={styles.serverToggle}>
            <Ionicons name="server-outline" size={15} color={colors.muted} />
            <Text style={styles.serverToggleText}>Server address</Text>
            <Ionicons name={showServer ? "chevron-up" : "chevron-down"} size={15} color={colors.muted} />
          </Pressable>
          {showServer && (
            <Field icon="globe-outline" placeholder="http://192.168.x.x:8000" value={origin} onChangeText={setOriginValue} autoCapitalize="none" />
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>{busy ? "Signing in…" : "Sign in"}</Text>
          </Pressable>

          <Text style={styles.hint}>Demo: admin / camhealth123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: ComponentProps<typeof TextInput> & { icon: keyof typeof Ionicons.glyphMap }) {
  const { icon, ...rest } = props;
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, alignItems: "center", paddingBottom: 56, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  logo: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: colors.tealBright,
    alignItems: "center", justifyContent: "center", marginBottom: 14, ...shadow.card,
  },
  logoMark: { color: "#04211f", fontWeight: "900", fontSize: 34 },
  brand: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: 0.3 },
  brandSub: { color: "#9fb4c9", fontSize: 12, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" },
  sheet: { marginTop: -26, marginHorizontal: 18, backgroundColor: colors.card, borderRadius: radius.lg, padding: 22, ...shadow.card },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink },
  subtitle: { color: colors.muted, marginBottom: 18, marginTop: 2 },
  field: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f4f7fa",
    borderRadius: radius.sm, paddingHorizontal: 14, height: 52, marginBottom: 12,
    borderWidth: 1, borderColor: colors.line,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink },
  serverToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, marginBottom: 4 },
  serverToggleText: { color: colors.muted, fontSize: 13, flex: 1 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 10, marginBottom: 6 },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  cta: { backgroundColor: colors.teal, height: 54, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: 10, ...shadow.soft },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  hint: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 14 },
});
