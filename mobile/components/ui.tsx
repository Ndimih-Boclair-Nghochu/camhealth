import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fs, initials, radius, s, shadow, spacing } from "../lib/theme";

/* ---------------- Layout ---------------- */

export function Screen({
  children,
  scroll,
  style,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
        <ScrollView
          contentContainerStyle={[{ padding: spacing.md, paddingBottom: s(40) }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

export function AppHeader({
  title,
  subtitle,
  back,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: insets.top + s(12) }]}>
      <View style={styles.glow} />
      <View style={styles.headerRow}>
        {back && (
          <Pressable onPress={onBack || (() => router.back())} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={s(24)} color="#fff" />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.headerSub} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {right}
      </View>
    </View>
  );
}

/* ---------------- Surfaces ---------------- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Avatar({ name, size = s(44), color = colors.teal }: { name: string; size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color + "22", alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ color, fontWeight: "800", fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}

/* ---------------- Pill ---------------- */

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
      <Text style={{ color: t.fg, fontSize: fs(11.5), fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

/* ---------------- Buttons ---------------- */

export function Button({
  label, onPress, loading, disabled, variant = "primary", icon, size: sz = "md",
}: {
  label: string; onPress?: () => void; loading?: boolean; disabled?: boolean;
  variant?: "primary" | "ghost" | "danger"; icon?: keyof typeof Ionicons.glyphMap;
  size?: "sm" | "md";
}) {
  const primary = variant === "primary";
  const danger = variant === "danger";
  const fg = danger ? colors.danger : primary ? "#fff" : colors.teal;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.btn,
        sz === "sm" && styles.btnSm,
        primary && styles.btnPrimary,
        variant === "ghost" && styles.btnGhost,
        danger && styles.btnDanger,
        (loading || disabled) && { opacity: 0.55 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon && <Ionicons name={icon} size={fs(18)} color={fg} />}
          <Text style={{ color: fg, fontWeight: "800", fontSize: fs(sz === "sm" ? 13.5 : 15.5) }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, tint = "#fff" }: { icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={s(22)} color={tint} />
    </Pressable>
  );
}

/* ---------------- Segmented control ---------------- */

export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { label: string; value: T }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segItem, on && styles.segItemOn]}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Bits ---------------- */

export function StatCard({ label, value, icon, tint = colors.teal }: {
  label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; tint?: string;
}) {
  return (
    <Card style={{ flex: 1, gap: s(8) }}>
      <View style={[styles.iconBubble, { backgroundColor: tint + "1e" }]}>
        <Ionicons name={icon} size={fs(18)} color={tint} />
      </View>
      <Text style={{ fontSize: fs(22), fontWeight: "800", color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: fs(12), color: colors.muted }}>{label}</Text>
    </Card>
  );
}

export function SectionTitle({ children, action, style }: { children: ReactNode; action?: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[{ fontSize: fs(16.5), fontWeight: "800", color: colors.ink }, style]}>{children}</Text>
      {action}
    </View>
  );
}

export function Row({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={({ pressed }: any) => [styles.row, pressed && styles.pressed, style]}>
      {children}
    </Wrapper>
  );
}

export function Empty({ icon = "file-tray-outline", text }: { icon?: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: s(34), gap: s(10) }}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={fs(26)} color={colors.muted} /></View>
      <Text style={{ color: colors.muted, fontSize: fs(13.5), textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export function Loader() {
  return (
    <View style={{ paddingVertical: s(44), alignItems: "center" }}>
      <ActivityIndicator color={colors.teal} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: s(20),
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: "hidden",
  },
  glow: { position: "absolute", top: -s(60), right: -s(50), width: s(180), height: s(180), borderRadius: s(90), backgroundColor: colors.teal, opacity: 0.25 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: s(6) },
  backBtn: { marginRight: s(2) },
  headerTitle: { color: "#fff", fontSize: fs(21), fontWeight: "800" },
  headerSub: { color: "#9fb4c9", fontSize: fs(12.5), marginTop: s(3) },

  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },

  pill: { paddingHorizontal: s(10), paddingVertical: s(4), borderRadius: radius.pill, alignSelf: "flex-start" },

  btn: { height: s(52), borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  btnSm: { height: s(40), borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  btnInner: { flexDirection: "row", alignItems: "center", gap: s(8) },
  btnPrimary: { backgroundColor: colors.teal, ...shadow.soft },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1.4, borderColor: colors.line },
  btnDanger: { backgroundColor: colors.dangerBg },

  seg: { flexDirection: "row", backgroundColor: "#e7edf3", borderRadius: radius.sm, padding: s(4) },
  segItem: { flex: 1, paddingVertical: s(9), borderRadius: radius.sm - s(4), alignItems: "center" },
  segItemOn: { backgroundColor: colors.card, ...shadow.soft },
  segText: { color: colors.sub, fontWeight: "700", fontSize: fs(13.5) },
  segTextOn: { color: colors.navy },

  iconBubble: { width: s(36), height: s(36), borderRadius: s(11), alignItems: "center", justifyContent: "center" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: s(10) },
  row: {
    flexDirection: "row", alignItems: "center", gap: s(12),
    paddingVertical: s(13), paddingHorizontal: s(14), backgroundColor: colors.card,
    borderRadius: radius.md, marginBottom: s(10), ...shadow.soft,
  },
  emptyIcon: { width: s(52), height: s(52), borderRadius: s(26), backgroundColor: "#eef2f6", alignItems: "center", justifyContent: "center" },
});
