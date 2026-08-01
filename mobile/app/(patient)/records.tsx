import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Empty, Loader, Pill } from "../../components/ui";
import { api, money } from "../../lib/api";
import { colors } from "../../lib/theme";
import type { RecordsBundle } from "../../lib/types";

export default function Records() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<RecordsBundle | null>(null);

  useEffect(() => {
    api.get<RecordsBundle>("/me/records/").then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>My Health</Text>
        {data && <Text style={styles.subtitle}>{data.patient.full_name} · {data.patient.patient_code}</Text>}
      </View>

      {!data ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <View style={styles.statRow}>
            <Stat label="Visits" value={data.consultations.length} icon="document-text" />
            <Stat label="Lab tests" value={data.lab_orders.length} icon="flask" />
            <Stat label="Bills" value={data.invoices.length} icon="cash" />
          </View>

          <Text style={styles.section}>Consultations</Text>
          {data.consultations.length === 0 ? (
            <Card><Empty icon="document-text-outline" text="No visits recorded yet." /></Card>
          ) : (
            data.consultations.map((c) => (
              <Card key={c.id} style={{ marginBottom: 10 }}>
                <Text style={styles.itemTitle}>{c.diagnosis || c.complaint}</Text>
                <Text style={styles.itemSub}>{c.complaint}</Text>
                <Text style={styles.date}>{new Date(c.created_at).toLocaleDateString()}{c.doctor_name ? ` · Dr ${c.doctor_name}` : ""}</Text>
              </Card>
            ))
          )}

          <Text style={styles.section}>Prescriptions</Text>
          {data.prescriptions.length === 0 ? (
            <Card><Empty icon="medkit-outline" text="No prescriptions yet." /></Card>
          ) : (
            data.prescriptions.map((p) => (
              <Card key={p.id} style={{ marginBottom: 10 }}>
                <Text style={styles.date}>{new Date(p.created_at).toLocaleDateString()}</Text>
                {p.items.map((it, i) => (
                  <Text key={i} style={styles.rx}>• {it.drug_name} {it.dosage} {it.frequency ? `— ${it.frequency}` : ""}</Text>
                ))}
              </Card>
            ))
          )}

          <Text style={styles.section}>Lab results</Text>
          {data.lab_orders.length === 0 ? (
            <Card><Empty icon="flask-outline" text="No lab results yet." /></Card>
          ) : (
            data.lab_orders.map((o) => (
              <Card key={o.id} style={{ marginBottom: 10 }}>
                <View style={styles.cardHead}>
                  <Text style={styles.date}>{new Date(o.created_at).toLocaleDateString()}</Text>
                  <Pill label={o.status_display} tone={o.status === "COMPLETED" ? "ok" : "warn"} />
                </View>
                {o.items.map((it) => (
                  <View key={it.id} style={styles.labLine}>
                    <Text style={styles.labName}>{it.test_name}</Text>
                    <Text style={styles.labVal}>{it.result_value ? `${it.result_value} ${it.unit}` : "pending"}</Text>
                  </View>
                ))}
              </Card>
            ))
          )}

          <Text style={styles.section}>Billing</Text>
          {data.invoices.length === 0 ? (
            <Card><Empty icon="cash-outline" text="No bills yet." /></Card>
          ) : (
            data.invoices.map((inv) => (
              <Card key={inv.id} style={[styles.cardHead, { marginBottom: 10 }]}>
                <View>
                  <Text style={styles.itemTitle}>{inv.number}</Text>
                  <Text style={styles.itemSub}>{money(inv.balance)} due of {money(inv.total)}</Text>
                </View>
                <Pill label={inv.status_display} tone={inv.status === "PAID" ? "ok" : inv.status === "PARTIAL" ? "warn" : "danger"} />
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Card style={{ flex: 1, alignItems: "center", gap: 6 }}>
      <Ionicons name={icon} size={20} color={colors.teal} />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 11.5, color: colors.muted }}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#9fb4c9", fontSize: 13, marginTop: 4 },
  statRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  itemTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  itemSub: { fontSize: 13, color: colors.sub, marginTop: 3 },
  date: { fontSize: 12, color: colors.muted, marginTop: 4 },
  rx: { fontSize: 13.5, color: colors.ink, marginTop: 5 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  labLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  labName: { fontSize: 14, color: colors.ink, fontWeight: "600" },
  labVal: { fontSize: 14, color: colors.sub },
});
