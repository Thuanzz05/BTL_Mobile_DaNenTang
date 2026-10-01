import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }): void;
      renderButton(
        element: HTMLElement,
        options: Record<string, string | number>,
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
let googleScript: Promise<GoogleIdentity> | undefined;

function loadGoogle() {
  if (window.google) return Promise.resolve(window.google);
  googleScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () =>
      window.google
        ? resolve(window.google)
        : reject(new Error("Không thể tải đăng nhập Google."));
    script.onerror = () => reject(new Error("Không thể tải đăng nhập Google."));
    document.head.appendChild(script);
  });
  return googleScript;
}

export function GoogleLoginButton({
  disabled,
  onError,
}: {
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const { client } = useAuth();
  const container = useRef<View>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const element = container.current as unknown as HTMLElement | null;
    if (!element) return;
    if (!webClientId) {
      onError("Đăng nhập Google chưa được cấu hình.");
      return;
    }

    let active = true;
    loadGoogle()
      .then((google) => {
        if (!active) return;
        google.accounts.id.initialize({
          client_id: webClientId,
          callback: async ({ credential }) => {
            if (!credential || submitting.current || disabled) return;
            submitting.current = true;
            setBusy(true);
            onError("");
            try {
              await client.loginWithGoogle(credential);
              router.dismissTo("/");
            } catch (error) {
              onError(
                (error as Error).message || "Không thể đăng nhập bằng Google.",
              );
            } finally {
              submitting.current = false;
              setBusy(false);
            }
          },
        });
        google.accounts.id.renderButton(element, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          locale: "vi",
          width: Math.min(element.clientWidth || 390, 400),
        });
      })
      .catch((error: Error) => active && onError(error.message));

    return () => {
      active = false;
      element.replaceChildren();
    };
  }, [client, disabled, onError]);

  return (
    <View
      pointerEvents={disabled || busy ? "none" : "auto"}
      style={[s.wrapper, (disabled || busy) && s.disabled]}
    >
      <View ref={container} style={s.button} />
      {busy && <ActivityIndicator style={s.loader} color={c.green} />}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  button: { width: "100%", alignItems: "center" },
  disabled: { opacity: 0.55 },
  loader: { position: "absolute", right: 14 },
});
