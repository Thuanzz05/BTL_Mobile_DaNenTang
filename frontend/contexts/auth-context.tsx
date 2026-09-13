import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthClient, User } from "@/services/auth-client";
import { api } from "@/services/api";
import { tokenStorage } from "@/services/token-storage";
interface AuthContextValue {
  user: User | null;
  ready: boolean;
  error: string;
  client: AuthClient;
  retry: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [client] = useState(() => new AuthClient(api, tokenStorage, setUser));
  useEffect(() => {
    let active = true;
    client
      .restore()
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [client]);
  const retry = async () => {
    setReady(false);
    setError("");
    try {
      await client.restore();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
    }
  };
  return (
    <AuthContext.Provider value={{ user, ready, error, client, retry }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is missing");
  return auth;
}
