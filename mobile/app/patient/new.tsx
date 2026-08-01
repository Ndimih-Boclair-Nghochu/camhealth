import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../../components/ui";
import { ScreenHeader, TextField } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";

const SEXES = [
  { v: "M", label: "Male" },
  { v: "F", label: "Female" },
  { v: "O", label: "Other" },
];

export default function NewPatient() {
  const router = useRouter();
  const [f, setF] = useState({
    first_name: "", last_name: "", sex: "M", date_of_birth: "",
    phone: "", blood_group: "", allergies: "", chronic_conditions: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  async function save() {
    if (!f.first_name || !f.last_name) {
      setError("First and last name are required.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const payload = { ...f, date_of_birth: f.date_of_birth || null };
      const { data } = await api.post("/patients/", payload);
      router.replace(`/patient/${data.id}`);
    } catch {
      setError("Could not save the patient. Check the connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Register patient" subtitle="Creates a file and unique ID" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><TextField label="First name" value={f.first_name} onChangeText={set("first_name")} /></View>
            <View style={{ flex: 1 }}><TextField label="Last name" value={f.last_name} onChangeText={set("last_name")} /></View>
          </View>

          <Text style={styles.label}>Sex</Text>
          <View style={styles.seg}>
            {SEXES.map((s) => (
              <Pressable
                key={s.v}
                onPress={() => set("sex")(s.v)}
                style={[styles.segItem, f.sex === s.v && styles.segItemOn]}
              >
                <Text style={[styles.segText, f.sex === s.v && styles.segTextOn]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <TextField label="Date of birth (YYYY-MM-DD)" value={f.date_of_birth} onChangeText={set("date_of_birth")} placeholder="1990-05-20" />
          <TextField label="Phone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <TextField label="Blood group" value={f.blood_group} onChangeText={set("blood_group")} placeholder="O+" />
          <TextField label="Allergies" value={f.allergies} onChangeText={set("allergies")} />
          <TextField label="Chronic conditions" value={f.chronic_conditions} onChangeText={set("chronic_conditions")} />

          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button label="Save patient" icon="save-outline" onPress={save} loading={busy} />
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
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
});
