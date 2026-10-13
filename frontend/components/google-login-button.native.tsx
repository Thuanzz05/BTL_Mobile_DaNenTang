import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TurboModuleRegistry,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
type GoogleSignInModule = typeof import("react-native-nitro-google-signin");
let googleSignIn: GoogleSignInModule | null | undefined;

function getGoogleSignIn() {
  if (googleSignIn !== undefined) return googleSignIn;
  if (!TurboModuleRegistry.get("NitroModules")) return (googleSignIn = null);

  googleSignIn = require("react-native-nitro-google-signin");
  if (webClientId) googleSignIn!.GoogleOneTapSignIn.configure({ webClientId });
  return googleSignIn;
}

export function GoogleLoginButton({
  disabled,
  onError,
}: {
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const { client } = useAuth();
  const [busy, setBusy] = useState(false);

  async function login() {
    if (!webClientId) {
      onError("Đăng nhập Google chưa được cấu hình.");
      return;
    }
    const google = getGoogleSignIn();
    if (!google) {
      onError("Đăng nhập Google cần bản development build. Expo Go chỉ hỗ trợ đăng nhập email.");
      return;
    }
    const {
      GoogleOneTapSignIn,
      isNoSavedCredentialFoundResponse,
      isSuccessResponse,
    } = google;
    setBusy(true);
    onError("");
    try {
      await GoogleOneTapSignIn.checkPlayServices();
      let response = await GoogleOneTapSignIn.signIn();
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
      }
      if (!isSuccessResponse(response)) return;
      if (!response.data.idToken)
        throw new Error("Google không trả về mã đăng nhập.");
      await client.loginWithGoogle(response.data.idToken);
      router.dismissTo("/");
    } catch (error) {
      onError((error as Error).message || "Không thể đăng nhập bằng Google.");
    } finally {
      setBusy(false);
    }
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
