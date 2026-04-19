"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "./api";
import { API_URL } from "./env";
import { setAccessToken, getAccessToken } from "./access-token";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: "DONOR" | "CREATOR";
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const syncToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setAccessTokenState(token);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await axios.post<{
        accessToken: string;
        user: AuthUser;
      }>(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
      syncToken(data.accessToken);
      setUser(data.user);
    } catch {
      syncToken(null);
      setUser(null);
    }
  }, [syncToken]);

  useEffect(() => {
    void (async () => {
      await refreshSession();
      setReady(true);
    })();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        "/api/auth/login",
        { email, password }
      );
      syncToken(data.accessToken);
      setUser(data.user);
    },
    [syncToken]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      role: "DONOR" | "CREATOR";
    }) => {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        "/api/auth/register",
        payload
      );
      syncToken(data.accessToken);
      setUser(data.user);
    },
    [syncToken]
  );

  const logout = useCallback(async () => {
    try {
      if (!getAccessToken()) {
        await refreshSession();
      }
      if (getAccessToken()) {
        await api.post("/api/auth/logout");
      }
    } finally {
      syncToken(null);
      setUser(null);
      router.push("/");
    }
  }, [router, syncToken, refreshSession]);

  const value = useMemo(
    () => ({
      user,
      ready,
      accessToken,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, ready, accessToken, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
