import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Empty, Loader, Pill } from "../../components/ui";
import { api, money } from "../../lib/api";
import { colors, radius, shadow } from "../../lib/theme";
import type { Drug, DrugOrder, Paginated } from "../../lib/types";

const METHODS = [
  { v: "CASH", label: "Cash" },
  { v: "MOMO_MTN", label: "MTN MoMo" },
  { v: "MOMO_ORANGE", label: "Orange" },
];

export default function PatientPharmacy() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"shop" | "orders">("shop");
  const [drugs, setDrugs] = useState<Drug[] | null>(null);
  const [orders, setOrders] = useState<DrugOrder[]>([]);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [fulfil, setFulfil] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [method, setMethod] = useState("CASH");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadDrugs(search = "") {
    const { data } = await api.get<Paginated<Drug>>("/shop/drugs/", { params: search ? { search } : {} });
    setDrugs(data.results);
  }
  async function loadOrders() {
    const { data } = await api.get<Paginated<DrugOrder>>("/orders/");
    setOrders(data.results);
  }
  useEffect(() => { loadDrugs(); loadOrders(); }, []);

  const drugById = (id: string) => drugs?.find((d) => d.id === id);
  const cartEntries = Object.entries(cart).filter(([, n]) => n > 0);
  const cartTotal = cartEntries.reduce((s, [id, n]) => s + Number(drugById(id)?.price ?? 0) * n, 0);
  const cartCount = cartEntries.reduce((s, [, n]) => s + n, 0);
  const setQty = (id: string, n: number) => setCart({ ...cart, [id]: Math.max(0, n) });

  async function placeOrder() {
    setBusy(true);
    try {
      const items = cartEntries.map(([id, n]) => {
        const d = drugById(id)!;
        return { drug: d.id, drug_name: d.name, unit_price: d.price, quantity: n };
      });
      await api.post("/orders/", { fulfilment: fulfil, payment_method: method, address, items });
      setCart({});
      setCheckout(false);
      setTab("orders");
      await loadOrders();
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Pharmacy</Text>
        <View style={styles.tabs}>
          {(["shop", "orders"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === "shop" ? "Shop" : "My orders"}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "shop" ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: cartCount ? 96 : 30 }}>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput placeholder="Search medicines" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} onSubmitEditing={() => loadDrugs(q)} returnKeyType="search" style={styles.searchInput} />
            </View>
            {drugs === null ? <Loader /> : drugs.length === 0 ? (
              <Card><Empty icon="cart-outline" text="No medicines available." /></Card>
            ) : (
              drugs.map((d) => {
                const n = cart[d.id] ?? 0;
                return (
                  <Card key={d.id} style={styles.drugRow}>
                    <View style={styles.pill}><Ionicons name="medkit" size={18} color={colors.teal} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drugName}>{d.name}</Text>
                      <Text style={styles.drugMeta}>{money(d.price)} · {d.unit}</Text>
                    </View>
                    {n === 0 ? (
                      <Pressable onPress={() => setQty(d.id, 1)} style={styles.addBtn}><Text style={styles.addText}>Add</Text></Pressable>
                    ) : (
                      <View style={styles.stepper}>
                        <Pressable onPress={() => setQty(d.id, n - 1)} style={styles.step}><Ionicons name="remove" size={18} color={colors.teal} /></Pressable>
                        <Text style={styles.stepN}>{n}</Text>
                        <Pressable onPress={() => setQty(d.id, n + 1)} style={styles.step}><Ionicons name="add" size={18} color={colors.teal} /></Pressable>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </ScrollView>

          {cartCount > 0 && !checkout && (
            <Pressable style={[styles.cartBar, { bottom: insets.bottom + 8 }]} onPress={() => setCheckout(true)}>
              <View style={styles.cartCount}><Text style={styles.cartCountText}>{cartCount}</Text></View>
              <Text style={styles.cartText}>Checkout</Text>
              <Text style={styles.cartTotal}>{money(cartTotal)}</Text>
            </Pressable>
          )}

          {checkout && (
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>Checkout · {money(cartTotal)}</Text>
                <Pressable onPress={() => setCheckout(false)}><Ionicons name="close" size={22} color={colors.muted} /></Pressable>
              </View>
              <View style={styles.segRow}>
                {(["PICKUP", "DELIVERY"] as const).map((f) => (
                  <Pressable key={f} onPress={() => setFulfil(f)} style={[styles.seg, fulfil === f && styles.segOn]}>
                    <Text style={[styles.segText, fulfil === f && styles.segTextOn]}>{f === "PICKUP" ? "Pickup" : "Delivery"}</Text>
                  </Pressable>
                ))}
              </View>
              {fulfil === "DELIVERY" && (
                <TextInput placeholder="Delivery address" placeholderTextColor={colors.muted} value={address} onChangeText={setAddress} style={styles.addr} />
              )}
              <View style={styles.segRow}>
                {METHODS.map((m) => (
                  <Pressable key={m.v} onPress={() => setMethod(m.v)} style={[styles.seg, method === m.v && styles.segOn]}>
                    <Text style={[styles.segText, method === m.v && styles.segTextOn]}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Button label={`Place order · ${money(cartTotal)}`} icon="bag-check-outline" onPress={placeOrder} loading={busy} />
            </View>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {orders.length === 0 ? (
            <Card><Empty icon="receipt-outline" text="No orders yet." /></Card>
          ) : (
            orders.map((o) => (
              <Card key={o.id} style={{ marginBottom: 10 }}>
                <View style={styles.orderHead}>
                  <Text style={styles.orderId}>Order #{o.id.slice(0, 6).toUpperCase()}</Text>
                  <Pill label={o.status_display} tone={o.status === "DELIVERED" ? "ok" : o.status === "CANCELLED" ? "danger" : "warn"} />
                </View>
                <Text style={styles.orderMeta}>{o.item_count} item(s) · {money(o.total)} · {o.fulfilment === "DELIVERY" ? "Delivery" : "Pickup"}</Text>
                <Text style={styles.orderDate}>{new Date(o.created_at).toLocaleString()}</Text>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  tabs: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, marginTop: 14 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabOn: { backgroundColor: "#fff" },
  tabText: { color: "#cfe0ee", fontWeight: "700", fontSize: 13 },
  tabTextOn: { color: colors.navy },
  search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: colors.line, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink },
  drugRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  pill: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.okBg, alignItems: "center", justifyContent: "center" },
  drugName: { fontSize: 15, fontWeight: "700", color: colors.ink },
  drugMeta: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  addBtn: { backgroundColor: colors.teal, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  addText: { color: "#fff", fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.4, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 6, height: 38 },
  step: { padding: 4 },
  stepN: { fontWeight: "800", color: colors.ink, minWidth: 16, textAlign: "center" },
  cartBar: { position: "absolute", left: 16, right: 16, backgroundColor: colors.teal, borderRadius: 16, height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, ...shadow.card },
  cartCount: { backgroundColor: "rgba(255,255,255,0.25)", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cartCountText: { color: "#fff", fontWeight: "800" },
  cartText: { color: "#fff", fontWeight: "800", fontSize: 16, flex: 1 },
  cartTotal: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, ...shadow.card },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
  segRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  seg: { flex: 1, borderWidth: 1.4, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 11, alignItems: "center" },
  segOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  segText: { color: colors.sub, fontWeight: "700", fontSize: 13 },
  segTextOn: { color: "#fff" },
  addr: { backgroundColor: "#f4f7fa", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, height: 48, paddingHorizontal: 12, color: colors.ink, marginBottom: 12 },
  orderHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 15, fontWeight: "800", color: colors.ink },
  orderMeta: { fontSize: 13, color: colors.sub, marginTop: 6 },
  orderDate: { fontSize: 11.5, color: colors.muted, marginTop: 4 },
});
