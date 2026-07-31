import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card, Empty, Loader, Pill } from "../../components/ui";
import { api, money } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import type { Consultation, Invoice, LabOrder, Paginated, Patient } from "../../lib/types";

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [labs, setLabs] = useState<LabOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    (async () => {
      const [p, c, l, i] = await Promise.all([
        api.get<Patient>(`/patients/${id}/`),
        api.get<Paginated<Consultation>>(`/consultations/`, { params: { patient: id } }),
        api.get<Paginated<LabOrder>>(`/lab-orders/`, { params: { patient: id } }),
        api.get<Paginated<Invoice>>(`/invoices/`, { params: { patient: id } }),
      ]);
      setPatient(p.data);
      setConsultations(c.data.results);
      setLabs(l.data.results);
      setInvoices(i.data.results);
    })();
  }, [id]);

  if (!patient) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loader /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ alignItems: "center", marginTop: 6 }}>
          <Avatar name={patient.full_name} size={64} color={colors.tealBright} />
          <Text style={styles.name}>{patient.full_name}</Text>
          <Text style={styles.code}>{patient.patient_code}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, marginTop: -22 }} contentContainerStyle={{ padding: 18, paddingBottom: 34 }}>
        <Card>
          <View style={styles.factRow}>
            <Fact label="Sex" value={patient.sex} />
            <Fact label="Age" value={patient.age != null ? `${patient.age}` : "—"} />
            <Fact label="Blood" value={patient.blood_group || "—"} />
          </View>
          {!!patient.phone && <Fact label="Phone" value={patient.phone} inline />}
          {!!patient.allergies && (
            <View style={styles.warnRow}>
              <Ionicons name="warning" size={15} color={colors.warn} />
              <Text style={styles.warnText}>Allergies: {patient.allergies}</Text>
            </View>
          )}
          {!!patient.chronic_conditions && (
            <View style={styles.warnRow}>
              <Ionicons name="pulse" size={15} color={colors.warn} />
              <Text style={styles.warnText}>Chronic: {patient.chronic_conditions}</Text>
            </View>
          )}
        </Card>

        <Text style={styles.section}>Consultations</Text>
        {consultations.length === 0 ? (
          <Card><Empty icon="document-text-outline" text="No consultations yet." /></Card>
        ) : (
          consultations.map((c) => (
            <Card key={c.id} style={{ marginBottom: 10 }}>
              <Text style={styles.itemTitle}>{c.diagnosis || c.complaint}</Text>
              <Text style={styles.itemSub}>{c.complaint}</Text>
              <Text style={styles.date}>
                {new Date(c.created_at).toLocaleDateString()}
                {c.doctor_name ? ` · Dr ${c.doctor_name}` : ""}
              </Text>
            </Card>
          ))
        )}

        <Text style={styles.section}>Lab results</Text>
        {labs.length === 0 ? (
          <Card><Empty icon="flask-outline" text="No lab orders yet." /></Card>
        ) : (
          labs.map((o) => (
            <Card key={o.id} style={{ marginBottom: 10 }}>
              <View style={styles.cardHead}>
                <Text style={styles.date}>{new Date(o.created_at).toLocaleDateString()}</Text>
                <Pill label={o.status_display} tone={o.status === "COMPLETED" ? "ok" : "warn"} />
              </View>
              {o.items.map((it) => (
                <View key={it.id} style={styles.labLine}>
                  <Text style={styles.labName}>{it.test_name}</Text>
                  <Text style={styles.labVal}>
                    {it.result_value ? `${it.result_value} ${it.unit}` : "pending"}
                    {it.flag && it.flag !== "PENDING" && it.flag !== "NORMAL" ? ` (${it.flag_display})` : ""}
                  </Text>
                </View>
              ))}
            </Card>
          ))
        )}

        <Text style={styles.section}>Billing</Text>
        {invoices.length === 0 ? (
          <Card><Empty icon="cash-outline" text="No invoices yet." /></Card>
        ) : (
          invoices.map((inv) => (
            <Card key={inv.id} style={[styles.cardHead, { marginBottom: 10 }]}>
              <View>
                <Text style={styles.itemTitle}>{inv.number}</Text>
                <Text style={styles.itemSub}>
                  {money(inv.amount_paid)} paid · {money(inv.balance)} due
                </Text>
              </View>
              <Pill
                label={inv.status_display}
                tone={inv.status === "PAID" ? "ok" : inv.status === "PARTIAL" ? "warn" : "danger"}
              />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Fact({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
  if (inline) {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValueInline}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy, paddingHorizontal: 16, paddingBottom: 40,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  back: { position: "absolute", left: 14, top: 0, zIndex: 2, paddingTop: 2 },
  name: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 10 },
  code: { color: "#9fb4c9", fontSize: 13, marginTop: 2 },
  factRow: { flexDirection: "row", justifyContent: "space-around" },
  factValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  factValueInline: { fontSize: 15, fontWeight: "600", color: colors.ink },
  factLabel: { fontSize: 12, color: colors.muted, marginTop: 3 },
  warnRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12, backgroundColor: colors.warnBg, padding: 9, borderRadius: 10 },
  warnText: { color: colors.warn, fontSize: 13, flex: 1 },
  section: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  itemSub: { fontSize: 13, color: colors.sub, marginTop: 3 },
  date: { fontSize: 12, color: colors.muted, marginTop: 6 },
  labLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  labName: { fontSize: 14, color: colors.ink, fontWeight: "600" },
  labVal: { fontSize: 14, color: colors.sub },
});
