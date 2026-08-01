import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import {
  FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../lib/api";
import { colors, fs, radius, s, shadow, spacing } from "../lib/theme";
import type { Paginated, Patient } from "../lib/types";
import { AppHeader, Avatar } from "./ui";

/** Stack-screen header (with a back button), unified with AppHeader. */
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return <AppHeader title={title} subtitle={subtitle} back right={right} />;
}

export function TextField({
  label, icon, ...props
}: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      {!!label && <Text style={k.label}>{label}</Text>}
      <View style={k.fieldWrap}>
        {icon && <Ionicons name={icon} size={fs(18)} color={colors.muted} />}
        <TextInput placeholderTextColor={colors.muted} style={k.input} {...props} />
      </View>
    </View>
  );
}

export function Fab({ icon = "add", onPress }: { icon?: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [k.fab, pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }]}>
      <Ionicons name={icon} size={s(26)} color="#fff" />
    </Pressable>
  );
}

export function PatientSelect({ value, onChange }: { value: Patient | null; onChange: (p: Patient) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [list, setList] = useState<Patient[]>([]);
  const insets = useSafeAreaInsets();

  async function search(text: string) {
    setQ(text);
    const { data } = await api.get<Paginated<Patient>>("/patients/", { params: text ? { search: text } : {} });
    setList(data.results);
  }

  useEffect(() => {
    if (open) search("");
  }, [open]);

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={k.label}>Patient</Text>
      <Pressable onPress={() => setOpen(true)} style={k.fieldWrap}>
        <Ionicons name="person-outline" size={fs(18)} color={colors.muted} />
        <Text style={{ flex: 1, color: value ? colors.ink : colors.muted, fontSize: fs(15) }}>
          {value ? `${value.patient_code} · ${value.full_name}` : "Select a patient"}
        </Text>
        <Ionicons name="chevron-down" size={fs(18)} color={colors.muted} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + s(10) }}>
          <View style={{ paddingHorizontal: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fs(18), fontWeight: "800", color: colors.ink }}>Choose patient</Text>
              <Pressable onPress={() => setOpen(false)}><Text style={{ color: colors.teal, fontWeight: "700" }}>Close</Text></Pressable>
            </View>
            <View style={k.fieldWrap}>
              <Ionicons name="search" size={fs(18)} color={colors.muted} />
              <TextInput placeholder="Search name or code" placeholderTextColor={colors.muted} value={q} onChangeText={search} autoFocus style={k.input} />
            </View>
          </View>
          <FlatList
            data={list}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: spacing.md }}
            renderItem={({ item }) => (
              <Pressable onPress={() => { onChange(item); setOpen(false); }} style={({ pressed }) => [k.pRow, pressed && { backgroundColor: "#f6f9fb" }]}>
                <Avatar name={item.full_name} size={s(38)} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: colors.ink }}>{item.full_name}</Text>
                  <Text style={{ color: colors.muted, fontSize: fs(12) }}>{item.patient_code}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: s(20) }}>No patients found.</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const k = StyleSheet.create({
  label: { fontSize: fs(12.5), color: colors.sub, marginBottom: s(6), fontWeight: "600" },
  fieldWrap: {
    flexDirection: "row", alignItems: "center", gap: s(10), backgroundColor: colors.card,
    borderRadius: radius.md, paddingHorizontal: s(14), minHeight: s(52), borderWidth: 1, borderColor: colors.line,
  },
  input: { flex: 1, fontSize: fs(15), color: colors.ink, paddingVertical: s(12) },
  fab: {
    position: "absolute", right: spacing.lg, bottom: s(26), width: s(58), height: s(58), borderRadius: s(29),
    backgroundColor: colors.teal, alignItems: "center", justifyContent: "center", ...shadow.card,
  },
  pRow: {
    flexDirection: "row", alignItems: "center", gap: s(12), paddingVertical: s(12), paddingHorizontal: s(14),
    backgroundColor: colors.card, borderRadius: radius.md, marginBottom: s(8), ...shadow.soft,
  },
});
