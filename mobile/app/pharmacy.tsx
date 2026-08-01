import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Card, Loader, Pill } from "../components/ui";
import { ScreenHeader, TextField } from "../components/kit";
import { api, money } from "../lib/api";
import { colors, radius } from "../lib/theme";
import type { Drug, Paginated } from "../lib/types";

const toneFor = (s: string) => (s === "OUT" ? "danger" : s === "LOW" ? "warn" : "ok");

export default function Pharmacy() {
  const [drugs, setDrugs] = useState<Drug[] | null>(null);
  const [alerts, setAlerts] = useState<Drug[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [nf, setNf] = useState({ name: "", unit: "tablet", price: "0", stock_quantity: "0", reorder_level: "10" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [qty, setQty] = useState("");

  async function load() {
    const [d, a] = await Promise.all([
      api.get<Paginated<Drug>>("/drugs/"),
      api.get<Drug[]>("/drugs/alerts/"),
    ]);
    setDrugs(d.data.results);
    setAlerts(a.data);
  }
  useEffect(() => { load(); }, []);

  async function addDrug() {
    await api.post("/drugs/", {
      ...nf, price: nf.price, stock_quantity: Number(nf.stock_quantity), reorder_level: Number(nf.reorder_level),
    });
    setNf({ name: "", unit: "tablet", price: "0", stock_quantity: "0", reorder_level: "10" });
    setShowAdd(false);
    load();
  }

  async function move(drug: Drug, kind: "IN" | "OUT") {
    const n = Number(qty);
    if (!n) return;
    await api.post("/stock-movements/", { drug: drug.id, kind, quantity: n });
    setOpenId(null); setQty("");
    load();
  }

  const setNfField = (k: keyof typeof nf) => (v: string) => setNf({ ...nf, [k]: v });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Pharmacy" subtitle="Stock & dispensing" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {alerts.length > 0 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={17} color={colors.warn} />
            <Text style={styles.alertText}>
              {alerts.length} item(s) need reordering: {alerts.map((d) => `${d.name} (${d.stock_quantity})`).join(", ")}
            </Text>
          </View>
        )}

        <Button label={showAdd ? "Close" : "＋ Add drug"} variant={showAdd ? "ghost" : "primary"} onPress={() => setShowAdd((s) => !s)} />
        {showAdd && (
          <Card style={{ marginTop: 14 }}>
            <TextField label="Drug name" value={nf.name} onChangeText={setNfField("name")} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><TextField label="Unit" value={nf.unit} onChangeText={setNfField("unit")} /></View>
              <View style={{ flex: 1 }}><TextField label="Price" value={nf.price} onChangeText={setNfField("price")} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><TextField label="Opening stock" value={nf.stock_quantity} onChangeText={setNfField("stock_quantity")} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><TextField label="Reorder at" value={nf.reorder_level} onChangeText={setNfField("reorder_level")} keyboardType="numeric" /></View>
            </View>
            <Button label="Save drug" icon="save-outline" onPress={addDrug} />
          </Card>
        )}

        <Text style={styles.section}>Stock</Text>
        {drugs === null ? (
          <Loader />
        ) : (
          drugs.map((d) => (
            <Card key={d.id} style={{ marginBottom: 10 }}>
              <Pressable onPress={() => { setOpenId(openId === d.id ? null : d.id); setQty(""); }} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={styles.sub}>{d.stock_quantity} {d.unit} · {money(d.price)}</Text>
                </View>
                <Pill label={`${d.stock_status} · ${d.stock_quantity}`} tone={toneFor(d.stock_status)} />
              </Pressable>
              {openId === d.id && (
                <View style={styles.moveRow}>
                  <View style={styles.qtyWrap}>
                    <TextInput placeholder="Qty" placeholderTextColor={colors.muted} keyboardType="numeric" value={qty} onChangeText={setQty} style={styles.qtyInput} />
                  </View>
                  <View style={{ flex: 1 }}><Button label="Dispense" onPress={() => move(d, "OUT")} /></View>
                  <View style={{ flex: 1 }}><Button label="Restock" variant="ghost" onPress={() => move(d, "IN")} /></View>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.warnBg, borderRadius: radius.sm, padding: 12, marginBottom: 14 },
  alertText: { color: colors.warn, fontSize: 13, flex: 1 },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 15, fontWeight: "700", color: colors.ink },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  moveRow: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  qtyWrap: { width: 66 },
  qtyInput: { backgroundColor: "#f4f7fa", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, height: 52, textAlign: "center", color: colors.ink, fontSize: 15 },
});
