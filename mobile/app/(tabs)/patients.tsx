import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Empty, Loader, Row } from "../../components/ui";
import { Fab } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";
import type { Paginated, Patient } from "../../lib/types";

export default function Patients() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Patient[] | null>(null);
  const [q, setQ] = useState("");

  async function load(search = "") {
    const { data } = await api.get<Paginated<Patient>>("/patients/", {
      params: search ? { search } : {},
    });
    setList(data.results);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={styles.head}>
        <Text style={styles.title}>Patients</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            placeholder="Search name, code or phone"
            placeholderTextColor={colors.muted}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => load(q)}
            returnKeyType="search"
            style={styles.searchInput}
          />
        </View>
      </View>

      {list === null ? (
        <Loader />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          ListEmptyComponent={<Empty icon="people-outline" text="No patients found." />}
          renderItem={({ item }) => (
            <Row onPress={() => router.push(`/patient/${item.id}`)}>
              <Avatar name={item.full_name} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.sub}>
                  {item.patient_code} · {item.sex}
                  {item.age != null ? ` · ${item.age}y` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Row>
          )}
        />
      )}
      <Fab icon="person-add" onPress={() => router.push("/patient/new")} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 12 },
  search: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card,
    borderRadius: radius.sm, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: colors.line,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink },
  name: { fontSize: 15.5, fontWeight: "700", color: colors.ink },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
