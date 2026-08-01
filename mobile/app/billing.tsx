import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Card, Empty, Loader, Pill } from "../components/ui";
import { PatientSelect, ScreenHeader } from "../components/kit";
import { api, money } from "../lib/api";
import { colors, radius } from "../lib/theme";
import type { Invoice, Paginated, Patient } from "../lib/types";

const METHODS = [
  { v: "CASH", label: "Cash" },
  { v: "MOMO_MTN", label: "MTN MoMo" },
  { v: "MOMO_ORANGE", label: "Orange Money" },
];

type Line = { description: string; quantity: string; unit_price: string };

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lines, setLines] = useState<Line[]>([{ description: "Consultation", quantity: "1", unit_price: "3000" }]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get<Paginated<Invoice>>("/invoices/");
    setInvoices(data.results);
  }
  useEffect(() => { load(); }, []);

  const total = lines.reduce((s, l) => s + Number(l.unit_price) * Number(l.quantity), 0);

  function setLine(i: number, k: keyof Line, v: string) {
    const next = [...lines];
    next[i] = { ...next[i], [k]: v };
    setLines(next);
  }

  async function create() {
    if (!patient) return;
    setBusy(true);
    try {
      await api.post("/invoices/", {
        patient: patient.id,
        items: lines.map((l) => ({ description: l.description, quantity: Number(l.quantity), unit_price: l.unit_price })),
      });
      setPatient(null);
      setLines([{ description: "Consultation", quantity: "1", unit_price: "3000" }]);
      setShowForm(false);
      await load();
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Billing" subtitle="Invoices & payments" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Button label={showForm ? "Close" : "＋ New invoice"} variant={showForm ? "ghost" : "primary"} onPress={() => setShowForm((s) => !s)} />

        {showForm && (
          <Card style={{ marginTop: 14 }}>
            <PatientSelect value={patient} onChange={setPatient} />
            {lines.map((l, i) => (
              <View key={i} style={styles.lineRow}>
                <TextInput placeholder="Item" placeholderTextColor={colors.muted} value={l.description} onChangeText={(v) => setLine(i, "description", v)} style={[styles.inp, { flex: 2 }]} />
                <TextInput placeholder="Qty" placeholderTextColor={colors.muted} keyboardType="numeric" value={l.quantity} onChangeText={(v) => setLine(i, "quantity", v)} style={[styles.inp, { flex: 0.7 }]} />
                <TextInput placeholder="Price" placeholderTextColor={colors.muted} keyboardType="numeric" value={l.unit_price} onChangeText={(v) => setLine(i, "unit_price", v)} style={[styles.inp, { flex: 1.2 }]} />
              </View>
            ))}
            <View style={styles.totalRow}>
              <Pressable onPress={() => setLines([...lines, { description: "", quantity: "1", unit_price: "0" }])}>
                <Text style={{ color: colors.teal, fontWeight: "700" }}>＋ Add line</Text>
              </Pressable>
              <Text style={styles.total}>Total: {money(total)}</Text>
            </View>
            <Button label="Create invoice" icon="receipt-outline" onPress={create} loading={busy} />
          </Card>
        )}

        <Text style={styles.section}>Invoices</Text>
        {invoices === null ? (
          <Loader />
        ) : invoices.length === 0 ? (
          <Card><Empty icon="cash-outline" text="No invoices yet." /></Card>
        ) : (
          invoices.map((inv) => <InvoiceCard key={inv.id} invoice={inv} onChanged={load} />)
        )}
      </ScrollView>
    </View>
  );
}

function InvoiceCard({ invoice, onChanged }: { invoice: Invoice; onChanged: () => void }) {
  const [pay, setPay] = useState(false);
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState(invoice.balance);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  async function record() {
    setBusy(true);
    try {
      await api.post("/payments/", { invoice: invoice.id, method, amount, reference: ref });
      setPay(false); setRef("");
      onChanged();
    } finally { setBusy(false); }
  }

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={styles.cardHead}>
        <View>
          <Text style={styles.name}>{invoice.number}</Text>
          <Text style={styles.sub}>{invoice.patient_name} · {money(invoice.balance)} due</Text>
        </View>
        <Pill label={invoice.status_display} tone={invoice.status === "PAID" ? "ok" : invoice.status === "PARTIAL" ? "warn" : "danger"} />
      </View>
      <View style={styles.amounts}>
        <Text style={styles.amt}>Total {money(invoice.total)}</Text>
        <Text style={styles.amt}>Paid {money(invoice.amount_paid)}</Text>
      </View>

      {invoice.status !== "PAID" && (
        <View style={{ marginTop: 10 }}>
          {!pay ? (
            <Button label="Record payment" variant="ghost" onPress={() => setPay(true)} />
          ) : (
            <View>
              <View style={styles.methods}>
                {METHODS.map((m) => (
                  <Pressable key={m.v} onPress={() => setMethod(m.v)} style={[styles.method, method === m.v && styles.methodOn]}>
                    <Text style={[styles.methodText, method === m.v && styles.methodTextOn]}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.lineRow}>
                <TextInput placeholder="Amount" placeholderTextColor={colors.muted} keyboardType="numeric" value={amount} onChangeText={setAmount} style={[styles.inp, { flex: 1 }]} />
                {method !== "CASH" && (
                  <TextInput placeholder="MoMo ref" placeholderTextColor={colors.muted} value={ref} onChangeText={setRef} style={[styles.inp, { flex: 1 }]} />
                )}
              </View>
              <Button label="Confirm payment" icon="checkmark-circle-outline" onPress={record} loading={busy} />
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  lineRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  inp: { backgroundColor: "#f4f7fa", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, height: 48, paddingHorizontal: 12, color: colors.ink },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  total: { fontWeight: "800", color: colors.navy2 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 15, fontWeight: "800", color: colors.ink },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  amounts: { flexDirection: "row", gap: 16, marginTop: 8 },
  amt: { fontSize: 13, color: colors.sub },
  methods: { flexDirection: "row", gap: 8, marginBottom: 10 },
  method: { flex: 1, borderWidth: 1.4, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  methodOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  methodText: { color: colors.sub, fontWeight: "600", fontSize: 12.5 },
  methodTextOn: { color: "#fff" },
});
