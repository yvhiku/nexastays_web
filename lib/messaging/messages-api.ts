/**
 * Nexa Stays messaging API (stays service).
 */

import axios, { AxiosError } from "axios";
import {
  refreshToken as refreshTokenApi,
  notifyTokenRefreshed,
  notifyAuthLogout,
} from "../auth-api";
import { getStaysApiBaseUrl } from "../env";

const API_BASE = getStaysApiBaseUrl();
const JWT_KEY = "nexa_access_token";
const REFRESH_TOKEN_KEY = "nexa_refresh_token";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as typeof err.config & { __refreshRetried?: boolean };
    if (!config) return Promise.reject(err);
    if (err.response?.status === 401 && !config.__refreshRetried && typeof window !== "undefined") {
      const hadAuth = config.headers?.["Authorization"] || config.headers?.Authorization;
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (hadAuth && refresh) {
        config.__refreshRetried = true;
        try {
          const tokens = await refreshTokenApi(refresh);
          localStorage.setItem(JWT_KEY, tokens.access_token);
          if (tokens.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          notifyTokenRefreshed(tokens.access_token);
          config.headers = { ...config.headers, Authorization: `Bearer ${tokens.access_token}` } as typeof config.headers;
          return client.request(config);
        } catch {
          localStorage.removeItem(JWT_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          notifyAuthLogout();
        }
      }
    }
    return Promise.reject(err);
  },
);

function getAuthHeaders(token?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = token ?? localStorage.getItem(JWT_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function unwrap<T>(res: { data?: { data?: T } | T }): T {
  const payload = res.data as { data?: T } | T;
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export interface ConversationPermissions {
  canSend: boolean;
  canUpload: boolean;
  canCall: boolean;
  canReport: boolean;
  canBlock: boolean;
  canReview: boolean;
  isReadOnly: boolean;
  canArchive: boolean;
  canDelete: boolean;
  notificationLevel: "ALL" | "IMPORTANT" | "MUTED";
}

export interface ReservationSnapshot {
  listingTitle: string;
  primaryPhotoUrl?: string | null;
  addressDisplay?: string | null;
  checkinDate: string;
  checkoutDate: string;
  guestCount: number;
  hostDisplayName?: string | null;
  guestDisplayName?: string | null;
  bookingReference?: string | null;
}

export interface ConversationListItem {
  id: string;
  type: string;
  messagingState: string;
  visibility: string;
  conversationVersion: number;
  lastMessageSequence: number;
  unreadCount: number;
  counterpart: {
    name: string;
    avatarUrl?: string | null;
    isSuperhost: boolean;
  };
  listing: {
    title: string;
    city?: string | null;
  };
  lastMessage: {
    preview: string | null;
    at: string | null;
    deliveryStatus?: string;
  };
  reservationSnapshot: ReservationSnapshot;
  permissions: ConversationPermissions;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  conversationSequence: number;
  senderId: string | null;
  type: string;
  body: string | null;
  metadata: Record<string, unknown>;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  isSystem: boolean;
  clientMessageId: string | null;
  createdAt: string;
  isOwn: boolean;
}

export interface ConversationDetail extends ConversationListItem {
  bookingId: string | null;
  bookingStatus?: string | null;
  messages: MessageDto[];
  hasMore: boolean;
}

export interface MessagesPage {
  messages: MessageDto[];
  hasMore: boolean;
}

export type InboxFilter = "all" | "unread" | "hosts" | "support";

export async function listConversations(
  token?: string | null,
  filter: InboxFilter = "all",
  q?: string,
): Promise<ConversationListItem[]> {
  const res = await client.get("/messaging/conversations", {
    headers: getAuthHeaders(token),
    params: { filter, ...(q?.trim() ? { q: q.trim() } : {}) },
  });
  return unwrap<ConversationListItem[]>(res);
}

export async function getUnreadConversationCount(token?: string | null): Promise<number> {
  const res = await client.get("/messaging/conversations/unread-count", {
    headers: getAuthHeaders(token),
  });
  const data = unwrap<{ count: number }>(res);
  return data.count ?? 0;
}

export async function getConversation(
  id: string,
  token?: string | null,
  beforeSequence?: number,
): Promise<ConversationDetail> {
  const res = await client.get(`/messaging/conversations/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(token),
    params: beforeSequence != null ? { before_sequence: beforeSequence } : undefined,
  });
  return unwrap<ConversationDetail>(res);
}

export async function listMessages(
  conversationId: string,
  token?: string | null,
  limit = 30,
  beforeSequence?: number,
): Promise<MessagesPage> {
  const res = await client.get(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      headers: getAuthHeaders(token),
      params: {
        limit,
        ...(beforeSequence != null ? { before_sequence: beforeSequence } : {}),
      },
    },
  );
  return unwrap<MessagesPage>(res);
}

export async function sendMessage(
  conversationId: string,
  body: string,
  token?: string | null,
  clientMessageId?: string,
): Promise<MessageDto> {
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      body,
      ...(clientMessageId ? { client_message_id: clientMessageId } : {}),
    },
    { headers: getAuthHeaders(token) },
  );
  return unwrap<MessageDto>(res);
}

export async function markConversationRead(
  conversationId: string,
  token?: string | null,
): Promise<void> {
  await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/read`,
    {},
    { headers: getAuthHeaders(token) },
  );
}

export async function updateConversationVisibility(
  conversationId: string,
  action: "archive" | "delete" | "restore",
  token?: string | null,
): Promise<void> {
  await client.patch(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/visibility`,
    { action },
    { headers: getAuthHeaders(token) },
  );
}

export async function reportConversation(
  conversationId: string,
  reason: string | undefined,
  token?: string | null,
): Promise<void> {
  await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/report`,
    { reason: reason ?? "" },
    { headers: getAuthHeaders(token) },
  );
}

export async function blockConversation(
  conversationId: string,
  token?: string | null,
): Promise<void> {
  await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/block`,
    {},
    { headers: getAuthHeaders(token) },
  );
}

export async function reportSafetyIssue(
  conversationId: string,
  token?: string | null,
): Promise<{ supportUrl: string }> {
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/safety`,
    {},
    { headers: getAuthHeaders(token) },
  );
  return unwrap<{ supportUrl: string }>(res);
}

/** Resolve inbox thread for a booking via reference search or listing title fallback. */
export async function findConversationForBooking(
  bookingId: string,
  bookingReference: string | null | undefined,
  token?: string | null,
): Promise<ConversationListItem | null> {
  if (bookingReference?.trim()) {
    const byRef = await listConversations(token, "all", bookingReference.trim());
    if (byRef.length > 0) return byRef[0];
  }

  const byId = await listConversations(token, "all", bookingId);
  if (byId.length > 0) return byId[0];

  const all = await listConversations(token, "all");
  for (const item of all) {
    try {
      const detail = await getConversation(item.id, token);
      if (detail.bookingId === bookingId) return item;
    } catch {
      /* skip inaccessible */
    }
  }
  return null;
}
