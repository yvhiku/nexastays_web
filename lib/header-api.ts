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

export async function getHeaderState(token: string): Promise<HeaderState> {
  try {
    const res = await fetch(`${getIdentityApiBaseUrl()}/users/me/header`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as Partial<HeaderState>;
    return {
      notificationCount: data.notificationCount ?? 0,
      inboxCount: data.inboxCount ?? 0,
      avatar: data.avatar ?? null,
      hostMode: data.hostMode ?? false,
    };
  } catch {
    return EMPTY;
  }
}
