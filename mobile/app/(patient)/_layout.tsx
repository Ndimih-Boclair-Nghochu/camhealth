import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../lib/auth";
import { colors, fs, s, shadow } from "../../lib/theme";

export default function PatientLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  if (!loading && !user) return <Redirect href="/login" />;
  if (user && user.role !== "PATIENT") return <Redirect href="/(tabs)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: s(58) + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : s(8),
          paddingTop: s(8),
          borderTopColor: colors.line,
          backgroundColor: colors.card,
          ...shadow.soft,
        },
        tabBarLabelStyle: { fontSize: fs(11), fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={fs(22)} color={color} /> }} />
      <Tabs.Screen name="care" options={{ title: "Care", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "medical" : "medical-outline"} size={fs(22)} color={color} /> }} />
      <Tabs.Screen name="pharmacy" options={{ title: "Pharmacy", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "cart" : "cart-outline"} size={fs(22)} color={color} /> }} />
      <Tabs.Screen name="records" options={{ title: "Records", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "folder-open" : "folder-open-outline"} size={fs(22)} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={fs(24)} color={color} /> }} />

      {/* Pushed screens — hidden from the tab bar */}
      <Tabs.Screen name="symptom" options={{ href: null }} />
      <Tabs.Screen name="directions" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
  );
}
