import * as SecureStore from "expo-secure-store";
const key = "wordleaf.refresh-token";
export const tokenStorage = {
  read: () => SecureStore.getItemAsync(key),
  write: (token: string) => SecureStore.setItemAsync(key, token),
  clear: () => SecureStore.deleteItemAsync(key),
};
