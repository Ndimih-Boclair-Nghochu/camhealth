import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, Empty } from "../components/ui";
import { ScreenHeader } from "../components/kit";
import { LeafletMap, type LatLng, type MapMarker } from "../components/LeafletMap";
import { api } from "../lib/api";
import { colors } from "../lib/theme";
import type { OnSiteStaff } from "../lib/types";

export default function StaffMap() {
  const [me, setMe] = useState<LatLng | null>(null);
  const [onSite, setOnSite] = useState<boolean | null>(null);
  const [staff, setStaff] = useState<OnSiteStaff[]>([]);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(true);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setDenied(true); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMe(here);
      // Report my location (server decides if I'm on the premises)
      await api.post("/me/location/", { latitude: here.lat, longitude: here.lng });
      // Fetch colleagues — only returned if I'm on site
      const { data } = await api.get<{ on_site: boolean; staff: OnSiteStaff[] }>("/staff/on-site/");
      setOnSite(data.on_site);
      setStaff(data.staff);
    } catch { /* ignore */ } finally { setBusy(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const markers: MapMarker[] = staff.map((s) => ({
    lat: s.latitude, lng: s.longitude, label: `${s.name} · ${s.role}`, color: "#1d6f6b",
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Staff on site"
        subtitle="Visible only while you're at the hospital"
        right={<Pressable onPress={refresh} hitSlop={10}><Ionicons name="refresh" size={20} color="#fff" /></Pressable>}
      />

      {busy && onSite === null ? (
        <View style={styles.center}><ActivityIndicator color={colors.teal} size="large" /></View>
      ) : denied ? (
        <View style={styles.center}><Empty icon="location-outline" text="Location permission is needed to use the staff map." /></View>
      ) : onSite === false ? (
        <View style={styles.center}>
          <View style={styles.offIcon}><Ionicons name="walk" size={30} color={colors.muted} /></View>
          <Text style={styles.offTitle}>You're off the premises</Text>
          <Text style={styles.offText}>Colleagues' locations are only shared while you're at the hospital. Check in on site to see who's around.</Text>
          <Pressable onPress={refresh} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={styles.onbar}>
            <View style={styles.dot} />
            <Text style={styles.onbarText}>You're on site · {staff.length} colleague{staff.length === 1 ? "" : "s"} nearby</Text>
          </View>
          <LeafletMap mode="markers" origin={me} markers={markers} style={{ flex: 1 }} />
          <ScrollView style={styles.list} contentContainerStyle={{ padding: 12 }}>
            {staff.length === 0 ? (
              <Card><Empty icon="people-outline" text="No other staff on site right now." /></Card>
            ) : (
              staff.map((s, i) => (
                <Card key={i} style={styles.row}>
                  <View style={styles.rowDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={styles.role}>{s.role}</Text>
                  </View>
                  <Ionicons name="location" size={18} color={colors.teal} />
                </Card>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 10 },
  offIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#eef2f6", alignItems: "center", justifyContent: "center" },
  offTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 6 },
  offText: { fontSize: 13.5, color: colors.muted, textAlign: "center", lineHeight: 20 },
  retry: { marginTop: 10, backgroundColor: colors.teal, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  retryText: { color: "#fff", fontWeight: "700" },
  onbar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.okBg, padding: 10, paddingHorizontal: 14 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ok },
  onbarText: { color: colors.ok, fontWeight: "700", fontSize: 13 },
  list: { maxHeight: "38%" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  rowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.teal },
  name: { fontSize: 15, fontWeight: "700", color: colors.ink },
  role: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
});
