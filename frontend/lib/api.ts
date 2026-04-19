"use client";

import axios from "axios";
import { API_URL } from "./env";
import { getAccessToken, setAccessToken } from "./access-token";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
const waiters: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      original?.url &&
      !String(original.url).includes("/api/auth/refresh") &&
      !String(original.url).includes("/api/auth/login") &&
      !String(original.url).includes("/api/auth/register")
    ) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waiters.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      const token = await refreshAccessToken();
      waiters.forEach((w) => w(token));
      waiters.length = 0;
      isRefreshing = false;
      if (!token) {
        return Promise.reject(error);
      }
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);
