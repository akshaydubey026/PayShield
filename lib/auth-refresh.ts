"use client";

import axios from "axios";
import { API_URL } from "./env";
import { setAccessToken } from "./access-token";

export type RefreshAuthPayload = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
  };
};

/**
 * Single-flight refresh: only one POST /api/auth/refresh runs at a time.
 * Concurrent callers await the same promise. This avoids backend refresh-token
 * rotation races (second request still carrying the old cookie → "reuse" path
 * deletes the session), which surfaced after Stripe redirects + React 18 Strict Mode.
 */
let inFlight: Promise<RefreshAuthPayload> | null = null;

export function refreshAccessTokenSingleFlight(): Promise<RefreshAuthPayload> {
  if (!inFlight) {
    inFlight = axios
      .post<RefreshAuthPayload>(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
