import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Card, Loader } from "../../components/ui";
import { ScreenHeader, TextField } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import type { Patient } from "../../lib/types";

const SEXES = [
  { v: "M", label: "Male" },
  { v: "F", label: "Female" },
  { v: "O", label: "Other" },
];

export default function EditProfile() {
  const router = useRouter();
  const [f, setF] = useState<Partial<Patient> | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Patient>("/me/profile/").then((r) => setF(r.data));
  }, []);

  if (!f) return <View style={{ flex: 1, backgroundColor: colors.bg }}><ScreenHeader title="Edit profile" /><Loader /></View>;

  const set = (k: keyof Patient) => (v: string) => setF({ ...f, [k]: v });

  async function save() {
    setBusy(true);
    try {
      await api.patch("/me/profile/", {
        first_name: f!.first_name, last_name: f!.last_name, sex: f!.sex,
        date_of_birth: f!.date_of_birth || null, phone: f!.phone, address: f!.address,
        blood_group: f!.blood_group, allergies: f!.allergies, chronic_conditions: f!.chronic_conditions,
      });
      setSaved(true);
      setTimeout(() => router.back(), 700);
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Edit profile" subtitle={f.patient_code} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><TextField label="First name" value={f.first_name || ""} onChangeText={set("first_name")} /></View>
            <View style={{ flex: 1 }}><TextField label="Last name" value={f.last_name || ""} onChangeText={set("last_name")} /></View>
          </View>

          <Text style={styles.label}>Sex</Text>
          <View style={styles.seg}>
            {SEXES.map((s) => (
              <Pressable key={s.v} onPress={() => set("sex")(s.v)} style={[styles.segItem, f.sex === s.v && styles.segItemOn]}>
                <Text style={[styles.segText, f.sex === s.v && styles.segTextOn]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <TextField label="Date of birth (YYYY-MM-DD)" value={f.date_of_birth || ""} onChangeText={set("date_of_birth")} placeholder="1990-05-20" />
          <TextField label="Phone" value={f.phone || ""} onChangeText={set("phone")} keyboardType="phone-pad" />
          <TextField label="Address" value={f.address || ""} onChangeText={set("address")} />
          <TextField label="Blood group" value={f.blood_group || ""} onChangeText={set("blood_group")} placeholder="O+" />
          <TextField label="Allergies" value={f.allergies || ""} onChangeText={set("allergies")} />
          <TextField label="Chronic conditions" value={f.chronic_conditions || ""} onChangeText={set("chronic_conditions")} />

          {saved && <Text style={styles.saved}>✓ Saved</Text>}
          <Button label="Save changes" icon="save-outline" onPress={save} loading={busy} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  seg: { flexDirection: "row", backgroundColor: "#eef2f6", borderRadius: radius.sm, padding: 4, marginBottom: 12 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  segItemOn: { backgroundColor: colors.teal },
  segText: { color: colors.sub, fontWeight: "600", fontSize: 14 },
  segTextOn: { color: "#fff" },
  saved: { color: colors.ok, fontWeight: "700", marginBottom: 8, textAlign: "center" },
});
