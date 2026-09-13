import { useSyncExternalStore } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
const subscribe = () => () => {};
export function useColorScheme(): "light" | "dark" {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const scheme = useNativeColorScheme();
  return hydrated && scheme === "dark" ? "dark" : "light";
}
