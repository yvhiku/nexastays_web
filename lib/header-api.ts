/**
 * Unified header state from identity service (notification + inbox counts, avatar, host mode).
 */

import { getIdentityApiBaseUrl } from "./env";

export type HeaderState = {
  notificationCount: number;
  inboxCount: number;
  avatar: string | null;
  hostMode: boolean;
};

const EMPTY: HeaderState = {
  notificationCount: 0,
  inboxCount: 0,
  avatar: null,
  hostMode: false,
};

function parseUnreadCount(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  if ("data" in payload) {
    const inner = (payload as { data: unknown }).data;
    if (inner && typeof inner === "object" && "count" in inner) {
      const count = (inner as { count: unknown }).count;
      return typeof count === "number" && Number.isFinite(count) ? count : null;
    }
  }
  if ("count" in payload) {
    const count = (payload as { count: unknown }).count;
    return typeof count === "number" && Number.isFinite(count) ? count : null;
  }
  return null;
}

export async function getHeaderState(token: string): Promise<HeaderState> {
  try {
    const base = getIdentityApiBaseUrl();
    const headers = { Authorization: `Bearer ${token}` };
    const [headerRes, unreadRes] = await Promise.all([
      fetch(`${base}/users/me/header`, { headers, cache: "no-store" }),
      fetch(`${base}/users/me/notifications/unread-count`, { headers, cache: "no-store" }),
    ]);
    if (!headerRes.ok) return EMPTY;
    const data = (await headerRes.json()) as Partial<HeaderState>;
    const freshUnread = unreadRes.ok ? parseUnreadCount(await unreadRes.json()) : null;
    return {
      notificationCount: freshUnread ?? data.notificationCount ?? 0,
      inboxCount: data.inboxCount ?? 0,
      avatar: data.avatar ?? null,
      hostMode: data.hostMode ?? false,
    };
  } catch {
    return EMPTY;
  }
}
