import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";

export default function PatientLayout() {
  const { user, loading } = useAuth();
  if (!loading && !user) return <Redirect href="/login" />;
  if (user && user.role !== "PATIENT") return <Redirect href="/(tabs)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 8, borderTopColor: colors.line, backgroundColor: colors.card },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="care" options={{ title: "Care", tabBarIcon: ({ color, size }) => <Ionicons name="medical" size={size} color={color} /> }} />
      <Tabs.Screen name="pharmacy" options={{ title: "Pharmacy", tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="records" options={{ title: "Records", tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }} />
    </Tabs>
  );
}
