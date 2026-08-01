import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "../../components/kit";
import { LeafletMap, type LatLng } from "../../components/LeafletMap";
import { api } from "../../lib/api";
import { colors } from "../../lib/theme";
import type { Facility } from "../../lib/types";

export default function Directions() {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "no-permission">("loading");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Facility>("/facility/");
        setFacility(data);
      } catch { /* ignore */ }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("no-permission");
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch { /* keep me null */ }
      setStatus("ready");
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Directions to hospital" subtitle={facility?.name || "CamHealth"} />

      {status === "no-permission" && (
        <View style={styles.banner}>
          <Ionicons name="location-outline" size={16} color={colors.warn} />
          <Text style={styles.bannerText}>Location is off — showing the hospital only. Turn on location for turn-by-turn directions.</Text>
        </View>
      )}

      {status === "loading" || !facility ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={styles.loading}>Finding your location…</Text>
        </View>
      ) : (
        <LeafletMap
          mode="route"
          origin={me}
          dest={{ lat: facility.latitude, lng: facility.longitude }}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loading: { color: colors.muted },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.warnBg, padding: 12 },
  bannerText: { color: colors.warn, fontSize: 12.5, flex: 1 },
});
