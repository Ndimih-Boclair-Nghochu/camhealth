import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "../components/Logo";
import { DEFAULT_ORIGIN, getOrigin, setOrigin } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, fs, radius, s, shadow, spacing } from "../lib/theme";

export default function Activate() {
  const { activateAccount } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [matricule, setMatricule] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [origin, setOriginValue] = useState(DEFAULT_ORIGIN);
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getOrigin().then(setOriginValue); }, []);

  async function submit() {
    if (!matricule.trim() || password.length < 6) {
      setError("Enter your matricule and a password of at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await setOrigin(origin);
      await activateAccount({ matricule: matricule.trim().toUpperCase(), password, username: username.trim() || undefined });
      router.replace("/");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not activate. Check the matricule and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + s(34) }]}>
          <Logo size={s(64)} style={{ marginBottom: s(12) }} />
          <Text style={styles.brand}>Activate your account</Text>
          <Text style={styles.brandSub}>Enter the matricule given to you by the hospital</Text>
        </View>

        <View style={styles.sheet}>
          <Field icon="key-outline" placeholder="Matricule (e.g. STF-7KQ4PZ)" value={matricule} onChangeText={setMatricule} autoCapitalize="characters" />
          <Field icon="at-outline" placeholder="Choose a username (optional)" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Create a password (min 6 chars)" value={password} onChangeText={setPassword} secureTextEntry />

          <Pressable onPress={() => setShowServer((v) => !v)} style={styles.serverToggle}>
            <Ionicons name="server-outline" size={s(15)} color={colors.muted} />
            <Text style={styles.serverToggleText}>Server address</Text>
            <Ionicons name={showServer ? "chevron-up" : "chevron-down"} size={s(15)} color={colors.muted} />
          </Pressable>
          {showServer && <Field icon="globe-outline" placeholder="http://192.168.x.x:8000" value={origin} onChangeText={setOriginValue} autoCapitalize="none" />}

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={s(16)} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [styles.cta, (busy || pressed) && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>{busy ? "Activating…" : "Activate account"}</Text>
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={{ color: colors.muted }}>Already activated? </Text>
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
      <Ionicons name={icon} size={s(18)} color={colors.muted} />
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, alignItems: "center", paddingBottom: s(46), borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  brand: { color: "#fff", fontSize: fs(22), fontWeight: "800" },
  brandSub: { color: "#9fb4c9", fontSize: fs(12.5), marginTop: s(4), textAlign: "center", paddingHorizontal: spacing.lg },
  sheet: { marginTop: -s(24), marginHorizontal: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card, marginBottom: s(24) },
  field: { flexDirection: "row", alignItems: "center", gap: s(10), backgroundColor: "#f4f7fa", borderRadius: radius.md, paddingHorizontal: s(14), height: s(52), marginBottom: s(12), borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontSize: fs(15), color: colors.ink },
  serverToggle: { flexDirection: "row", alignItems: "center", gap: s(6), paddingVertical: s(4), marginBottom: s(4) },
  serverToggleText: { color: colors.muted, fontSize: fs(13), flex: 1 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: s(8), backgroundColor: colors.dangerBg, padding: s(10), borderRadius: radius.sm, marginBottom: s(6) },
  errorText: { color: colors.danger, fontSize: fs(13), flex: 1 },
  cta: { backgroundColor: colors.teal, height: s(54), borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: s(8), ...shadow.soft },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: fs(16) },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: s(16) },
});
