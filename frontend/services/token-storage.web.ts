// Web preview: keep the token only for the lifetime of the current tab.
const key = "wordleaf.refresh-token";
export const tokenStorage = {
  read: async () =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(key),
  write: async (token: string) => {
    window.sessionStorage.setItem(key, token);
  },
  clear: async () => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
  },
};
