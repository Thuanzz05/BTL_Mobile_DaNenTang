import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Href, Link } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";
export default function AccountScreen() {
  const { user, client, ready, error, retry } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function logout() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await client.logout();
    } catch {
      setNotice(
        "Đã xóa phiên trên thiết bị. Máy chủ chưa xác nhận thu hồi phiên; hãy kiểm tra kết nối.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={["top"]} style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Tài khoản</Text>
        <View style={s.avatar}>
          <Ionicons name="person-outline" size={40} color={c.green} />
        </View>
        {!ready ? (
          <ActivityIndicator color={c.green} />
        ) : user ? (
          <>
            <Text style={s.title}>{user.ho_ten}</Text>
            <Text style={s.body}>{user.email}</Text>
            <View style={s.info}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={c.green}
              />
              <Text style={s.body}>
                Bạn đã đăng nhập. Tiến độ cá nhân được lấy từ tài khoản của bạn.
              </Text>
            </View>
            <Link href={"/favorites" as Href} asChild>
              <Pressable accessibilityRole="button" style={s.menuItem}>
                <View style={s.menuIcon}>
                  <Ionicons name="heart-outline" size={23} color={c.green} />
                </View>
                <View style={s.menuText}>
                  <Text style={s.menuTitle}>Từ yêu thích</Text>
                  <Text style={s.body}>Xem lại những từ bạn đã lưu</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.muted} />
              </Pressable>
            </Link>
            <Link href={"/history" as Href} asChild>
              <Pressable accessibilityRole="button" style={s.menuItem}>
                <View style={s.menuIcon}>
                  <Ionicons name="time-outline" size={23} color={c.green} />
                </View>
                <View style={s.menuText}>
                  <Text style={s.menuTitle}>Lịch sử học tập</Text>
                  <Text style={s.body}>Xem lại các buổi học gần đây</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.muted} />
              </Pressable>
            </Link>
            <Pressable
              accessibilityRole="button"
              style={s.button}
              disabled={busy}
              onPress={logout}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={s.white}>Đăng xuất</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={s.title}>Bắt đầu hành trình của bạn</Text>
            <Text style={s.body}>
              Đăng nhập để theo dõi tiến độ học và lưu các từ yêu thích.
            </Text>
            <Link href="/login" asChild>
              <Pressable accessibilityRole="button" style={s.button}>
                <Text style={s.white}>Đăng nhập</Text>
              </Pressable>
            </Link>
            <Link href="/register" asChild>
              <Pressable accessibilityRole="button" style={s.secondary}>
                <Text style={s.link}>Tạo tài khoản miễn phí</Text>
              </Pressable>
            </Link>
          </>
        )}
        {!!error && !user && (
          <>
            <Text accessibilityRole="alert" style={s.body}>
              Chưa khôi phục được phiên: {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={retry}
              disabled={!ready}
              style={s.secondary}
            >
              <Text style={s.link}>Thử khôi phục lại</Text>
            </Pressable>
          </>
        )}
        {!!notice && (
          <Text accessibilityRole="alert" style={s.body}>
            {notice}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 26,
    gap: 20,
    width: "100%",
    maxWidth: 550,
    alignSelf: "center",
  },
  heading: { color: c.ink, fontWeight: "800", fontSize: 30 },
  title: { color: c.ink, fontSize: 23, fontWeight: "700" },
  avatar: {
    height: 88,
    width: 88,
    borderRadius: 28,
    backgroundColor: c.soft,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  body: { color: c.muted, fontSize: 15, lineHeight: 24, flexShrink: 1 },
  info: {
    backgroundColor: c.soft,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    gap: 12,
  },
  button: {
    padding: 17,
    backgroundColor: c.green,
    borderRadius: 15,
    alignItems: "center",
    minHeight: 54,
  },
  white: { color: "white", fontWeight: "700", fontSize: 16 },
  secondary: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  link: { color: c.green, fontWeight: "700", fontSize: 15 },
  menuItem: {
    minHeight: 72,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuTitle: { color: c.ink, fontSize: 16, fontWeight: "700" },
});
