import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@camhealth/shared";

import { api, login as apiLogin, logout as apiLogout } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>(null as unknown as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const { data } = await api.get<User>("/users/me/");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("camhealth.access")) loadMe();
    else setLoading(false);
  }, []);

  async function signIn(username: string, password: string) {
    await apiLogin(username, password);
    setLoading(true);
    await loadMe();
  }

  function signOut() {
    apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
