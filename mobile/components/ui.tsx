import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, initials, radius, shadow } from "../lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Avatar({ name, size = 44, color = colors.teal }: { name: string; size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color + "22", alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ color, fontWeight: "800", fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

type Tone = "ok" | "warn" | "danger" | "neutral" | "info";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: colors.okBg, fg: colors.ok },
  warn: { bg: colors.warnBg, fg: colors.warn },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: "#eef2f6", fg: colors.navy2 },
  info: { bg: "#e4f1f0", fg: colors.teal },
};

export function Pill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={{ color: t.fg, fontSize: 11.5, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

export function Button({
  label, onPress, loading, variant = "primary", icon,
}: {
  label: string; onPress?: () => void; loading?: boolean;
  variant?: "primary" | "ghost"; icon?: keyof typeof Ionicons.glyphMap;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        primary ? styles.btnPrimary : styles.btnGhost,
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#fff" : colors.teal} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon && <Ionicons name={icon} size={18} color={primary ? "#fff" : colors.teal} />}
          <Text style={{ color: primary ? "#fff" : colors.teal, fontWeight: "700", fontSize: 15 }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function StatCard({ label, value, icon, tint = colors.teal }: {
  label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; tint?: string;
}) {
  return (
    <Card style={{ flex: 1, gap: 10 }}>
      <View style={[styles.iconBubble, { backgroundColor: tint + "1e" }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
    </Card>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink }}>{children}</Text>
      {action}
    </View>
  );
}

export function Row({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={({ pressed }: any) => [styles.row, pressed && { backgroundColor: "#f6f9fb" }]}>
      {children}
    </Wrapper>
  );
}

export function Empty({ icon = "file-tray-outline", text }: { icon?: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 34, gap: 8 }}>
      <Ionicons name={icon} size={30} color={colors.muted} />
      <Text style={{ color: colors.muted }}>{text}</Text>
    </View>
  );
}

export function Loader() {
  return (
    <View style={{ paddingVertical: 40, alignItems: "center" }}>
      <ActivityIndicator color={colors.teal} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, ...shadow.card },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" },
  btn: { height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnPrimary: { backgroundColor: colors.teal, ...shadow.soft },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1.4, borderColor: colors.line },
  iconBubble: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.card,
    borderRadius: radius.sm, marginBottom: 8, ...shadow.soft,
  },
});
