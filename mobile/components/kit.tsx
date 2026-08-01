import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../lib/api";
import { colors, radius, shadow } from "../lib/theme";
import type { Paginated, Patient } from "../lib/types";
import { Avatar } from "./ui";

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[k.header, { paddingTop: insets.top + 8 }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginRight: 6 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={k.title}>{title}</Text>
        <View style={{ flex: 1 }} />
        {right}
      </View>
      {!!subtitle && <Text style={k.sub}>{subtitle}</Text>}
    </View>
  );
}

export function TextField({
  label, icon, ...props
}: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={k.label}>{label}</Text>}
      <View style={k.fieldWrap}>
        {icon && <Ionicons name={icon} size={18} color={colors.muted} />}
        <TextInput placeholderTextColor={colors.muted} style={k.input} {...props} />
      </View>
    </View>
  );
}

export function Fab({ icon = "add", onPress }: { icon?: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [k.fab, pressed && { opacity: 0.9 }]}>
      <Ionicons name={icon} size={26} color="#fff" />
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
    <View style={{ marginBottom: 12 }}>
      <Text style={k.label}>Patient</Text>
      <Pressable onPress={() => setOpen(true)} style={k.fieldWrap}>
        <Ionicons name="person-outline" size={18} color={colors.muted} />
        <Text style={{ flex: 1, color: value ? colors.ink : colors.muted, fontSize: 15 }}>
          {value ? `${value.patient_code} · ${value.full_name}` : "Select a patient"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 10 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Choose patient</Text>
              <Pressable onPress={() => setOpen(false)}><Text style={{ color: colors.teal, fontWeight: "700" }}>Close</Text></Pressable>
            </View>
            <View style={k.fieldWrap}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                placeholder="Search name or code" placeholderTextColor={colors.muted}
                value={q} onChangeText={search} autoFocus style={k.input}
              />
            </View>
          </View>
          <FlatList
            data={list}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { onChange(item); setOpen(false); }}
                style={({ pressed }) => [k.pRow, pressed && { backgroundColor: "#f6f9fb" }]}
              >
                <Avatar name={item.full_name} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: colors.ink }}>{item.full_name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{item.patient_code}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>No patients found.</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const k = StyleSheet.create({
  header: {
    backgroundColor: colors.navy, paddingHorizontal: 14, paddingBottom: 18,
    borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: { color: "#9fb4c9", fontSize: 13, marginTop: 4, marginLeft: 30 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 5 },
  fieldWrap: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card,
    borderRadius: radius.sm, paddingHorizontal: 14, minHeight: 50, borderWidth: 1, borderColor: colors.line,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 12 },
  fab: {
    position: "absolute", right: 20, bottom: 26, width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.teal, alignItems: "center", justifyContent: "center", ...shadow.card,
  },
  pRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.card, borderRadius: radius.sm, marginBottom: 8, ...shadow.soft,
  },
});
