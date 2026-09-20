import { useRef, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { palette as c } from "@/constants/palette";
import { api } from "@/services/api";

interface ForgotPasswordResult {
  expiresInMinutes: number;
  ma_xac_nhan_thu_nghiem?: string;
}

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<ForgotPasswordResult>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      router.push({
        pathname: "/reset-password",
        params: {
          email: normalizedEmail,
          ...(result.ma_xac_nhan_thu_nghiem
            ? { code: result.ma_xac_nhan_thu_nghiem, development: "1" }
            : {}),
        },
      });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại đăng nhập"
            style={s.back}
            disabled={busy}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={c.ink} />
          </Pressable>

          <View style={s.icon}>
            <Ionicons name="key-outline" size={31} color="white" />
          </View>
          <Text style={s.eyebrow}>KHÔI PHỤC TÀI KHOẢN</Text>
          <Text style={s.title}>Quên mật khẩu?</Text>
          <Text style={s.body}>
            Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận có hiệu lực
            trong 10 phút.
          </Text>

          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={21} color={c.muted} />
                <TextInput
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ban@example.com"
                  placeholderTextColor={c.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!busy}
                  onSubmitEditing={submit}
                  style={s.input}
                />
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={submit}
              style={[s.button, busy && s.disabled]}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={s.buttonText}>Gửi mã xác nhận</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => router.replace("/login")}
          >
            <Text style={s.loginLink}>Quay lại đăng nhập</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: {
    padding: 26,
    paddingBottom: 42,
    gap: 18,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  back: { width: 44, height: 44, justifyContent: "center" },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: c.ink, fontSize: 35, fontWeight: "800", letterSpacing: -1 },
  body: { color: c.muted, fontSize: 15, lineHeight: 23 },
  form: { gap: 20, marginTop: 10 },
  field: { gap: 8 },
  label: { color: c.ink, fontSize: 14, fontWeight: "700" },
  inputRow: {
    minHeight: 56,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: c.ink, fontSize: 16, paddingVertical: 14 },
  button: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  error: {
    color: c.danger,
    backgroundColor: "#FBE8E3",
    padding: 14,
    borderRadius: 12,
  },
  loginLink: {
    color: c.green,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    padding: 13,
  },
});
