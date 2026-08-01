import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Card, Empty, Loader, Pill } from "../components/ui";
import { PatientSelect, ScreenHeader } from "../components/kit";
import { api } from "../lib/api";
import { colors, radius } from "../lib/theme";
import type { LabOrder, LabResult, LabTest, Paginated, Patient } from "../lib/types";

export default function Laboratory() {
  const [orders, setOrders] = useState<LabOrder[] | null>(null);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [showOrder, setShowOrder] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const [o, t] = await Promise.all([
      api.get<LabOrder[]>("/lab-orders/pending/"),
      api.get<Paginated<LabTest>>("/lab-tests/"),
    ]);
    setOrders(o.data);
    setTests(t.data.results);
  }
  useEffect(() => { load(); }, []);

  async function order() {
    if (!patient) return;
    const items = tests.filter((t) => picked[t.id]).map((t) => ({ test: t.id, test_name: t.name }));
    if (!items.length) return;
    setBusy(true);
    try {
      await api.post("/lab-orders/", { patient: patient.id, items });
      setPatient(null); setPicked({}); setShowOrder(false);
      await load();
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Laboratory" subtitle="Orders & results" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Button label={showOrder ? "Close" : "＋ Order tests"} variant={showOrder ? "ghost" : "primary"} onPress={() => setShowOrder((s) => !s)} />

        {showOrder && (
          <Card style={{ marginTop: 14 }}>
            <PatientSelect value={patient} onChange={setPatient} />
            <Text style={styles.label}>Tests</Text>
            <View style={styles.chips}>
              {tests.map((t) => {
                const on = !!picked[t.id];
                return (
                  <Pressable key={t.id} onPress={() => setPicked({ ...picked, [t.id]: !on })} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.name}</Text>
                  </Pressable>
                );
              })}
              {tests.length === 0 && <Text style={{ color: colors.muted }}>No tests in the catalogue yet.</Text>}
            </View>
            <Button label="Order selected tests" icon="flask-outline" onPress={order} loading={busy} />
          </Card>
        )}

        <Text style={styles.section}>Work list</Text>
        {orders === null ? (
          <Loader />
        ) : orders.length === 0 ? (
          <Card><Empty icon="flask-outline" text="No pending lab orders." /></Card>
        ) : (
          orders.map((o) => <OrderCard key={o.id} order={o} onSaved={load} />)
        )}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, onSaved }: { order: LabOrder; onSaved: () => void }) {
  const [items, setItems] = useState<LabResult[]>(order.items);
  const [busy, setBusy] = useState(false);

  function setItem(i: number, key: keyof LabResult, v: string) {
    const next = [...items];
    next[i] = { ...next[i], [key]: v } as LabResult;
    setItems(next);
  }

  async function save() {
    setBusy(true);
    try {
      await api.patch(`/lab-orders/${order.id}/`, {
        items: items.map((it) => ({ id: it.id, test_name: it.test_name, result_value: it.result_value, unit: it.unit, flag: it.flag })),
      });
      onSaved();
    } finally { setBusy(false); }
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={styles.cardHead}>
        <Text style={styles.name}>{order.patient_name}</Text>
        <Pill label={order.status_display} tone={order.status === "COMPLETED" ? "ok" : "warn"} />
      </View>
      {items.map((it, i) => (
        <View key={it.id} style={styles.resRow}>
          <Text style={styles.testName}>{it.test_name}</Text>
          <View style={styles.resInputs}>
            <TextInput placeholder="Result" placeholderTextColor={colors.muted} value={it.result_value} onChangeText={(v) => setItem(i, "result_value", v)} style={[styles.inp, { flex: 2 }]} />
            <TextInput placeholder="Unit" placeholderTextColor={colors.muted} value={it.unit} onChangeText={(v) => setItem(i, "unit", v)} style={[styles.inp, { flex: 1 }]} />
          </View>
        </View>
      ))}
      <View style={{ marginTop: 8 }}><Button label="Save results" icon="save-outline" onPress={save} loading={busy} /></View>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1.4, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { color: colors.sub, fontWeight: "600", fontSize: 13 },
  chipTextOn: { color: "#fff" },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  name: { fontSize: 15, fontWeight: "800", color: colors.ink },
  resRow: { marginBottom: 10 },
  testName: { fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  resInputs: { flexDirection: "row", gap: 8 },
  inp: { backgroundColor: "#f4f7fa", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, height: 46, paddingHorizontal: 12, color: colors.ink },
});
