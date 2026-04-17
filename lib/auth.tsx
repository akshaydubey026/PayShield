"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** True while session is being restored from the server (refresh cookie + /me). */
  loading: boolean;
  /** Hydration complete: `!loading`. Kept for existing call sites. */
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
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const sessionRevision = useRef(0);

  const syncToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setAccessTokenState(token);
  }, []);

  const refreshSession = useCallback(async () => {
    const rev = sessionRevision.current;
    try {
      const { data } = await axios.post<{
        accessToken: string;
        user: AuthUser;
      }>(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
      if (rev !== sessionRevision.current) return;
      syncToken(data.accessToken);
      setUser(data.user);
    } catch {
      if (rev !== sessionRevision.current) return;
      syncToken(null);
      setUser(null);
    }
  }, [syncToken]);

  useEffect(() => {
    const restore = async () => {
      setLoading(true);
      try {
        await refreshSession();
        if (getAccessToken()) {
          try {
            const { data } = await api.get<{ user: AuthUser }>("/api/auth/me");
            setUser(data.user);
          } catch {
            /* keep user from refresh if /me fails */
          }
        }
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      sessionRevision.current += 1;
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        "/api/auth/login",
        { email, password }
      );
      syncToken(data.accessToken);
      setUser(data.user);
      setLoading(false);
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
      sessionRevision.current += 1;
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        "/api/auth/register",
        payload
      );
      syncToken(data.accessToken);
      setUser(data.user);
      setLoading(false);
    },
    [syncToken]
  );

  const logout = useCallback(async () => {
    sessionRevision.current += 1;
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
      loading,
      ready: !loading,
      accessToken,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, loading, accessToken, login, register, logout, refreshSession]
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
