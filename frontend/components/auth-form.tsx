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
import { Link, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const params = useLocalSearchParams<{
    email?: string;
    registered?: string;
  }>();
  const { client, ready } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current || !ready) return;
    setError("");
    if (register && (name.trim().length < 2 || name.trim().length > 150)) {
      setError("Họ tên cần từ 2 đến 150 ký tự.");
      return;
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 150
    ) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (
      encodeURIComponent(password).replace(/%[A-F\d]{2}/gi, "x").length > 72
    ) {
      setError("Mật khẩu quá dài (tối đa 72 byte).");
      return;
    }
    if (register && password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      if (register) {
        await client.register(name, email, password);
        router.replace({
          pathname: "/login",
          params: { email: email.trim(), registered: "1" },
        });
      } else {
        await client.login(email, password);
        router.dismissTo("/");
      }
    } catch (e) {
      setError((e as Error).message);
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
            accessibilityLabel="Về trang chủ"
            style={s.back}
            onPress={() => router.dismissTo("/")}
            disabled={busy}
          >
            <Ionicons name="arrow-back" size={24} color={c.ink} />
          </Pressable>
          <View style={s.logo}>
            <Ionicons name="layers" size={30} color="white" />
          </View>
          <Text style={s.eyebrow}>WORDLEAF · HỌC MỖI NGÀY</Text>
          <Text style={s.title}>
            {register
              ? "Hành trình mới,\nbắt đầu từ bạn."
              : "Chào mừng\nbạn trở lại."}
          </Text>
          <Text style={s.body}>
            {register
              ? "Tạo tài khoản để lưu tiến độ và những từ bạn yêu thích."
              : "Đăng nhập để tiếp tục hành trình học từ vựng."}
          </Text>
          {!register && params.registered === "1" && (
            <Text accessibilityRole="alert" style={s.success}>
              Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.
            </Text>
          )}
          {error !== "" && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <View style={s.form}>
            {register && (
              <View style={s.field}>
                <Text style={s.label}>Họ và tên</Text>
                <TextInput
                  accessibilityLabel="Họ và tên"
                  value={name}
                  onChangeText={setName}
                  placeholder="Nguyễn Văn An"
                  placeholderTextColor={c.muted}
                  autoComplete="name"
                  maxLength={150}
                  style={s.input}
                  editable={!busy}
                />
              </View>
            )}
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
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
                maxLength={150}
                style={s.input}
                editable={!busy}
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Mật khẩu</Text>
              <View style={s.passwordRow}>
                <TextInput
                  accessibilityLabel="Mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ít nhất 6 ký tự"
                  placeholderTextColor={c.muted}
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={register ? "new-password" : "current-password"}
                  style={s.passwordInput}
                  editable={!busy}
                  onSubmitEditing={register ? undefined : submit}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  style={s.eye}
                  onPress={() => setVisible((v) => !v)}
                >
                  <Ionicons
                    name={visible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={c.muted}
                  />
                </Pressable>
              </View>
            </View>
            {register && (
              <View style={s.field}>
                <Text style={s.label}>Xác nhận mật khẩu</Text>
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
                  style={s.input}
                  editable={!busy}
                  onSubmitEditing={submit}
                />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={register ? "Tạo tài khoản" : "Đăng nhập"}
              accessibilityState={{ disabled: busy || !ready }}
              disabled={busy || !ready}
              onPress={submit}
              style={[s.button, (busy || !ready) && s.disabled]}
            >
              {busy || !ready ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={s.buttonText}>
                    {register ? "Tạo tài khoản" : "Đăng nhập"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </Pressable>
          </View>
          <View style={s.switch}>
            <Text style={s.body}>
              {register ? "Bạn đã có tài khoản?" : "Bạn chưa có tài khoản?"}
            </Text>
            <Link href={register ? "/login" : "/register"} asChild>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                style={s.linkButton}
              >
                <Text style={s.link}>
                  {register ? "Đăng nhập" : "Đăng ký miễn phí"}
                </Text>
              </Pressable>
            </Link>
          </View>
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
    gap: 18,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 40,
  },
  back: { width: 44, height: 44, justifyContent: "center" },
  logo: {
    width: 58,
    height: 58,
    backgroundColor: c.green,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: c.green,
  },
  title: {
    fontSize: 35,
    fontWeight: "800",
    lineHeight: 44,
    color: c.ink,
    letterSpacing: -1,
  },
  body: { fontSize: 14, color: c.muted, lineHeight: 22 },
  form: { gap: 18, marginTop: 8 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: c.ink },
  input: {
    minHeight: 54,
    padding: 15,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 14,
    backgroundColor: c.surface,
    color: c.ink,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: "row",
    minHeight: 54,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 14,
    backgroundColor: c.surface,
    alignItems: "center",
  },
  passwordInput: { flex: 1, padding: 15, color: c.ink, fontSize: 16 },
  eye: { padding: 14 },
  button: {
    minHeight: 54,
    padding: 16,
    borderRadius: 15,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.55 },
  error: {
    color: c.danger,
    backgroundColor: "#FBE8E3",
    padding: 14,
    borderRadius: 12,
    lineHeight: 22,
  },
  success: {
    color: c.green,
    backgroundColor: c.soft,
    padding: 14,
    borderRadius: 12,
    lineHeight: 22,
  },
  switch: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  linkButton: { padding: 12 },
  link: { color: c.green, fontWeight: "700", fontSize: 14 },
});
