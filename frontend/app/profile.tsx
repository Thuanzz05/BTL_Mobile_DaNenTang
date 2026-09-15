import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";

export default function ProfileScreen() {
  const { client, ready, user } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState<"profile" | "password" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user]);

  async function saveProfile() {
    const value = (name ?? user?.ho_ten ?? "").trim();
    if (value.length < 2 || value.length > 150) {
      setError("Họ tên cần từ 2 đến 150 ký tự.");
      return;
    }
    setBusy("profile");
    setError("");
    setMessage("");
    try {
      await client.updateProfile(value);
      setName(value);
      setMessage("Đã cập nhật hồ sơ.");
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function savePassword() {
    setError("");
    setMessage("");
    if (newPassword.length < 6) {
      setError("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setBusy("password");
    try {
      await client.changePassword(currentPassword, newPassword);
      router.replace({ pathname: "/login", params: { passwordChanged: "1" } });
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={s.back}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={c.ink} />
          </Pressable>
          <View>
            <Text style={s.eyebrow}>TÀI KHOẢN CỦA BẠN</Text>
            <Text style={s.heading}>Hồ sơ và mật khẩu</Text>
          </View>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          {!ready || !user ? (
            <ActivityIndicator size="large" color={c.green} />
          ) : (
            <>
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
              {!!message && (
                <Text accessibilityRole="alert" style={s.success}>
                  {message}
                </Text>
              )}

              <View style={s.card}>
                <View style={s.sectionTitle}>
                  <Ionicons name="person-outline" size={22} color={c.green} />
                  <Text style={s.title}>Thông tin cá nhân</Text>
                </View>
                <View style={s.field}>
                  <Text style={s.label}>Họ và tên</Text>
                  <TextInput
                    accessibilityLabel="Họ và tên"
                    value={name ?? user.ho_ten}
                    onChangeText={setName}
                    maxLength={150}
                    editable={!busy}
                    style={s.input}
                  />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>Email</Text>
                  <Text style={s.readonly}>{user.email}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!!busy}
                  onPress={saveProfile}
                  style={[s.button, !!busy && s.disabled]}
                >
                  {busy === "profile" ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={s.white}>Lưu thay đổi</Text>
                  )}
                </Pressable>
              </View>

              <View style={s.card}>
                <View style={s.sectionTitle}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={c.green}
                  />
                  <Text style={s.title}>Đổi mật khẩu</Text>
                </View>
                <Text style={s.body}>
                  Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên thiết bị này.
                </Text>
                <PasswordField
                  label="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!busy}
                />
                <PasswordField
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!busy}
                />
                <PasswordField
                  label="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!busy}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={
                    !!busy ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  onPress={savePassword}
                  style={[
                    s.button,
                    (!!busy ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword) &&
                      s.disabled,
                  ]}
                >
                  {busy === "password" ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={s.white}>Đổi mật khẩu</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  heading: { color: c.ink, fontSize: 25, fontWeight: "800" },
  content: {
    padding: 22,
    gap: 14,
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 16,
  },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { color: c.ink, fontSize: 18, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22 },
  field: { gap: 7 },
  label: { color: c.ink, fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 52,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.background,
    color: c.ink,
    fontSize: 16,
  },
  readonly: {
    minHeight: 48,
    paddingVertical: 13,
    color: c.muted,
    fontSize: 15,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  white: { color: "white", fontWeight: "700", fontSize: 15 },
  error: {
    color: c.danger,
    backgroundColor: "#FBE8E3",
    padding: 14,
    borderRadius: 12,
  },
  success: {
    color: c.green,
    backgroundColor: c.soft,
    padding: 14,
    borderRadius: 12,
  },
});
