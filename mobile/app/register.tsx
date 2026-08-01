import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEFAULT_ORIGIN, getOrigin, setOrigin } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radius, shadow } from "../lib/theme";

export default function Register() {
  const { signUp } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", phone: "", password: "" });
  const [origin, setOriginValue] = useState(DEFAULT_ORIGIN);
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOrigin().then(setOriginValue);
  }, []);

  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  async function submit() {
    if (!form.username || form.password.length < 6) {
      setError("Enter a username and a password of at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await setOrigin(origin);
      await signUp(form);
      router.replace("/(tabs)");
    } catch (e: any) {
      const detail = e?.response?.data;
      setError(
        detail?.username?.[0] ||
        (e?.response ? "Could not create the account. Check your details." : "Cannot reach the server. Check the address and Wi-Fi.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + 34 }]}>
          <View style={styles.logo}><Text style={styles.logoMark}>C</Text></View>
          <Text style={styles.brand}>Create your account</Text>
          <Text style={styles.brandSub}>Full access to every CamHealth service</Text>
        </View>

        <View style={styles.sheet}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><Field icon="person-outline" placeholder="First name" value={form.first_name} onChangeText={set("first_name")} /></View>
            <View style={{ flex: 1 }}><Field icon="person-outline" placeholder="Last name" value={form.last_name} onChangeText={set("last_name")} /></View>
          </View>
          <Field icon="at-outline" placeholder="Username" value={form.username} onChangeText={set("username")} autoCapitalize="none" />
          <Field icon="call-outline" placeholder="Phone (optional)" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <Field icon="lock-closed-outline" placeholder="Password (min 6 chars)" value={form.password} onChangeText={set("password")} secureTextEntry />

          <Pressable onPress={() => setShowServer((s) => !s)} style={styles.serverToggle}>
            <Ionicons name="server-outline" size={15} color={colors.muted} />
            <Text style={styles.serverToggleText}>Server address</Text>
            <Ionicons name={showServer ? "chevron-up" : "chevron-down"} size={15} color={colors.muted} />
          </Pressable>
          {showServer && <Field icon="globe-outline" placeholder="http://192.168.x.x:8000" value={origin} onChangeText={setOriginValue} autoCapitalize="none" />}

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>{busy ? "Creating account…" : "Create account"}</Text>
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={{ color: colors.muted }}>Already have an account? </Text>
            <Link href="/login" replace><Text style={{ color: colors.teal, fontWeight: "700" }}>Sign in</Text></Link>
          </View>
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
  hero: { backgroundColor: colors.navy, alignItems: "center", paddingBottom: 46, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.tealBright, alignItems: "center", justifyContent: "center", marginBottom: 12, ...shadow.card },
  logoMark: { color: "#04211f", fontWeight: "900", fontSize: 30 },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  brandSub: { color: "#9fb4c9", fontSize: 12.5, marginTop: 4 },
  sheet: { marginTop: -24, marginHorizontal: 18, backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, ...shadow.card, marginBottom: 24 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f4f7fa", borderRadius: radius.sm, paddingHorizontal: 14, height: 52, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontSize: 15, color: colors.ink },
  serverToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, marginBottom: 4 },
  serverToggleText: { color: colors.muted, fontSize: 13, flex: 1 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 10, marginBottom: 6 },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  cta: { backgroundColor: colors.teal, height: 54, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: 8, ...shadow.soft },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
});
