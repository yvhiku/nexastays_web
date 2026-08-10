/**
 * User notification inbox API (identity service).
 */

import axios from "axios";
import { getIdentityApiBaseUrl } from "./env";
import { bearerAuthHeaders } from "./access-token-store";
import { attachBrowserBearerAuth } from "./attach-browser-bearer-auth";

const API_BASE = getIdentityApiBaseUrl();
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
client.defaults.headers.common["X-Auth-Transport"] = "cookie";
attachBrowserBearerAuth(client);

function getAuthHeaders(token?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  if (token) return { Authorization: `Bearer ${token}` };
  return bearerAuthHeaders();
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
