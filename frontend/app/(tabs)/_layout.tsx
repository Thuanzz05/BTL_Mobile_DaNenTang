import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
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
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: "Tra từ",
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Ôn tập",
          tabBarIcon: ({ color }) => (
            <Feather name="refresh-cw" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
const s = StyleSheet.create({
  bar: {
    height: 66,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: c.surface,
    borderTopColor: c.line,
  },
  label: { fontSize: 12, fontWeight: "600" },
});
