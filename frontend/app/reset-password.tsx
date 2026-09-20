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

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    code?: string;
    development?: string;
  }>();
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [code, setCode] = useState(
    typeof params.code === "string" ? params.code : "",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Mã xác nhận phải gồm đúng 6 chữ số.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }
    if (
      encodeURIComponent(password).replace(/%[A-F\d]{2}/gi, "x").length > 72
    ) {
      setError("Mật khẩu quá dài (tối đa 72 byte).");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          ma_xac_nhan: code,
          mat_khau_moi: password,
        }),
      });
      setComplete(true);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <SafeAreaView style={s.page}>
        <View style={s.successContent}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark" size={39} color="white" />
          </View>
          <Text style={s.title}>Mật khẩu đã được đổi</Text>
          <Text style={s.centerBody}>
            Tất cả phiên đăng nhập cũ đã được thu hồi để bảo vệ tài khoản.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={s.button}
            onPress={() =>
              router.replace({
                pathname: "/login",
                params: { email, passwordChanged: "1" },
              })
            }
          >
            <Text style={s.buttonText}>Đăng nhập bằng mật khẩu mới</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
            accessibilityLabel="Quay lại"
            style={s.back}
            disabled={busy}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={c.ink} />
          </Pressable>
          <View style={s.icon}>
            <Ionicons name="shield-checkmark-outline" size={32} color="white" />
          </View>
          <Text style={s.eyebrow}>BẢO MẬT TÀI KHOẢN</Text>
          <Text style={s.title}>Tạo mật khẩu mới</Text>
          <Text style={s.body}>
            Nhập mã xác nhận và chọn mật khẩu mới cho tài khoản của bạn.
          </Text>

          {params.development === "1" && (
            <View style={s.devNotice}>
              <Ionicons name="code-slash-outline" size={20} color={c.green} />
              <Text style={s.devText}>
                Môi trường local: mã thử nghiệm đã được điền tự động.
              </Text>
            </View>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}

          <View style={s.form}>
            <Field label="Email">
              <TextInput
                accessibilityLabel="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!busy}
                style={s.input}
              />
            </Field>
            <Field label="Mã xác nhận">
              <TextInput
                accessibilityLabel="Mã xác nhận"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
                placeholder="6 chữ số"
                placeholderTextColor={c.muted}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                editable={!busy}
                style={[s.input, s.codeInput]}
              />
            </Field>
            <Field label="Mật khẩu mới">
              <View style={s.passwordRow}>
                <TextInput
                  accessibilityLabel="Mật khẩu mới"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ít nhất 6 ký tự"
                  placeholderTextColor={c.muted}
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!busy}
                  style={s.passwordInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onPress={() => setVisible((value) => !value)}
                  style={s.eye}
                >
                  <Ionicons
                    name={visible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={c.muted}
                  />
                </Pressable>
              </View>
            </Field>
            <Field label="Xác nhận mật khẩu">
              <TextInput
                accessibilityLabel="Xác nhận mật khẩu"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={c.muted}
                secureTextEntry={!visible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                editable={!busy}
                onSubmitEditing={submit}
                style={s.input}
              />
            </Field>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={submit}
              style={[s.button, busy && s.disabled]}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={s.buttonText}>Đặt lại mật khẩu</Text>
              )}
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() =>
              router.replace({
                pathname: "/forgot-password",
                params: { email },
              })
            }
          >
            <Text style={s.resend}>Gửi lại mã xác nhận</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: {
    padding: 26,
    paddingBottom: 42,
    gap: 16,
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
    marginTop: 5,
  },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: c.ink, fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  body: { color: c.muted, fontSize: 15, lineHeight: 23 },
  centerBody: {
    color: c.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  form: { gap: 16, marginTop: 6 },
  field: { gap: 7 },
  label: { color: c.ink, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 54,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    color: c.ink,
    fontSize: 16,
  },
  codeInput: { fontSize: 20, fontWeight: "800", letterSpacing: 7 },
  passwordRow: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, padding: 15, color: c.ink, fontSize: 16 },
  eye: { padding: 14 },
  button: {
    minHeight: 56,
    paddingHorizontal: 16,
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
  devNotice: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.soft,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  devText: { flex: 1, color: c.green, fontSize: 13, lineHeight: 19 },
  resend: {
    color: c.green,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    padding: 12,
  },
  successContent: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 18,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 27,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
