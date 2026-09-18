import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { palette as c } from "@/constants/palette";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.green,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: s.bar,
        tabBarLabelStyle: s.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Ôn tập",
          tabBarIcon: ({ color }) => (
            <Ionicons name="refresh-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
const s = StyleSheet.create({
  bar: { backgroundColor: c.surface, borderTopColor: c.line },
  label: { fontSize: 12, fontWeight: "600" },
});
