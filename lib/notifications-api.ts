/**
 * User notification inbox API (identity service).
 */

import axios, { AxiosError } from "axios";
import {
  refreshToken as refreshTokenApi,
  notifyTokenRefreshed,
  notifyAuthLogout,
} from "./auth-api";
import { getIdentityApiBaseUrl } from "./env";

const API_BASE = getIdentityApiBaseUrl();
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
client.defaults.headers.common["X-Auth-Transport"] = "cookie";

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as typeof err.config & { __refreshRetried?: boolean };
    if (!config) return Promise.reject(err);
    if (err.response?.status === 401 && !config.__refreshRetried && typeof window !== "undefined") {
      const hadAuth = config.headers?.["Authorization"] || config.headers?.Authorization;
      if (hadAuth) {
        config.__refreshRetried = true;
        try {
          const tokens = await refreshTokenApi();
          notifyTokenRefreshed(tokens.access_token);
          config.headers = { ...config.headers, Authorization: `Bearer ${tokens.access_token}` } as typeof config.headers;
          return client.request(config);
        } catch {
          notifyAuthLogout();
        }
      }
    }
    return Promise.reject(err);
  },
);

function getAuthHeaders(token?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface UserNotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

function unwrap<T>(res: { data?: { data?: T } | T }): T {
  const payload = res.data as { data?: T } | T;
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function getNotifications(
  token?: string | null,
  limit = 20,
): Promise<UserNotificationItem[]> {
  const res = await client.get("/users/me/notifications", {
    headers: getAuthHeaders(token),
    params: { limit },
  });
  return unwrap<UserNotificationItem[]>(res);
}

export async function getUnreadNotificationCount(
  token?: string | null,
): Promise<number> {
  const res = await client.get("/users/me/notifications/unread-count", {
    headers: getAuthHeaders(token),
  });
  const data = unwrap<{ count: number }>(res);
  return data.count ?? 0;
}

export async function markNotificationRead(
  id: string,
  token?: string | null,
): Promise<UserNotificationItem> {
  const res = await client.patch(
    `/users/me/notifications/${encodeURIComponent(id)}/read`,
    {},
    { headers: getAuthHeaders(token) },
  );
  return unwrap<UserNotificationItem>(res);
}

export async function markAllNotificationsRead(
  token?: string | null,
): Promise<number> {
  const res = await client.patch(
    "/users/me/notifications/read-all",
    {},
    { headers: getAuthHeaders(token) },
  );
  const data = unwrap<{ updated: number }>(res);
  return data.updated ?? 0;
}
