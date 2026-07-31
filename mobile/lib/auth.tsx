import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api, hasToken, login as apiLogin, logout as apiLogout } from "./api";
import type { User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  signIn: (u: string, p: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue>(null as unknown as AuthValue);

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
    (async () => {
      if (await hasToken()) await loadMe();
      else setLoading(false);
    })();
  }, []);

  async function signIn(username: string, password: string) {
    await apiLogin(username, password);
    setLoading(true);
    await loadMe();
  }

  async function signOut() {
    await apiLogout();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
