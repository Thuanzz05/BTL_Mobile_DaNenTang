import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
// import { router } from "expo-router";
// import {
//   GoogleOneTapSignIn,
//   isNoSavedCredentialFoundResponse,
//   isSuccessResponse,
// } from "react-native-nitro-google-signin";
// import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";

// Temporarily disabled - requires React Native 0.75+
// const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
// if (webClientId) GoogleOneTapSignIn.configure({ webClientId });

export function GoogleLoginButton({
  disabled,
  onError,
}: {
  disabled: boolean;
  onError: (message: string) => void;
}) {
  // const { client } = useAuth();
  const [busy] = useState(false);

  async function login() {
    // Temporarily disabled - requires React Native 0.75+ and TurboModules
    onError("Đăng nhập Google tạm thời không khả dụng. Vui lòng dùng email/password.");
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Đăng nhập bằng Google"
      disabled={disabled || busy}
      onPress={login}
      style={[s.button, (disabled || busy) && s.disabled]}
    >
      {busy ? (
        <ActivityIndicator color={c.ink} />
      ) : (
        <>
          <FontAwesome name="google" size={19} color="#DB4437" />
          <Text style={s.text}>Đăng nhập bằng Google</Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    minHeight: 54,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: { color: c.ink, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.55 },
});
