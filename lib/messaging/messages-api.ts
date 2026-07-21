/**
 * Nexa Stays messaging API (stays service) — v3 presentation model.
 */

import axios, { AxiosError } from "axios";
import {
  normalizeMessageDto,
  normalizeMessages,
  type MessageDto,
  type AttachmentDto,
} from "./message-normalize";
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

export interface SignedMedia {
  url: string;
  version: number;
  expiresAt: string;
}

export interface ReservationPresentation {
  listingTitle: string;
  listingId: string | null;
  coverMedia: SignedMedia | null;
  addressDisplay: string | null;
  city: string | null;
  country: string | null;
  checkinDate: string;
  checkoutDate: string;
  guestCount: number;
  bookingReference: string | null;
  bookingId: string | null;
}

export interface ConversationPresentation {
  title: string;
  subtitle: string;
  avatar: SignedMedia | null;
  bookingChip: string | null;
  statusChip: string | null;
  counterpart: {
    id: string;
    displayName: string;
    verified?: boolean;
    rating?: number | null;
  };
  listing: {
    title: string;
    city?: string | null;
  };
  reservation: ReservationPresentation;
}

export interface ConversationSyncMeta {
  conversationVersion: number;
  snapshotVersion: number;
  attachmentVersion?: number;
  lastMessageId: string | null;
  unreadCount: number;
  lastReadPointer: {
    messageId: string | null;
    readAt: string | null;
  };
}

export interface ConversationDomain {
  id: string;
  type: string;
  bookingId: string | null;
  listingId: string | null;
  messagingState: string;
  visibility: string;
}

export interface ConversationListResponse {
  conversation: ConversationDomain;
  presentation: ConversationPresentation;
  sync: ConversationSyncMeta;
  lastMessage: {
    preview: string | null;
    at: string | null;
  };
  permissions: ConversationPermissions;
}

export type {
  AttachmentDto,
  DeliveryState,
  MessageDto,
  MessagePayload,
  TimelineCardPayload,
  TextPayload,
  MediaPayload,
} from "./message-normalize";

export interface ConversationDetailResponse {
  conversation: ConversationDomain;
  presentation: ConversationPresentation;
  timeline: MessageDto[];
  permissions: ConversationPermissions;
  sync: ConversationSyncMeta;
  hasMore: boolean;
  bookingStatus: string | null;
}

export interface MessagesPage {
  messages: MessageDto[];
  hasMore: boolean;
}

export type InboxFilter = "all" | "unread" | "hosts" | "support";

/** Convenience alias for inbox rows */
export type ConversationListItem = ConversationListResponse;

/** Convenience alias for thread detail */
export type ConversationDetail = ConversationDetailResponse & {
  /** @deprecated use timeline */
  messages: MessageDto[];
  bookingId: string | null;
  bookingStatus?: string | null;
};

function normalizeDetail(raw: ConversationDetailResponse): ConversationDetail {
  const timeline = normalizeMessages(raw.timeline ?? []);
  return {
    ...raw,
    timeline,
    messages: timeline,
    bookingId: raw.conversation.bookingId,
    bookingStatus: raw.bookingStatus ?? undefined,
  };
}

export async function listConversations(
  token?: string | null,
  filter: InboxFilter = "all",
  q?: string,
): Promise<ConversationListResponse[]> {
  const res = await client.get("/messaging/conversations", {
    headers: getAuthHeaders(token),
    params: { filter, ...(q?.trim() ? { q: q.trim() } : {}) },
  });
  return unwrap<ConversationListResponse[]>(res);
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
  return normalizeDetail(unwrap<ConversationDetailResponse>(res));
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
  const page = unwrap<MessagesPage>(res);
  return { ...page, messages: normalizeMessages(page.messages) };
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
  return normalizeMessageDto(unwrap<MessageDto>(res));
}

export async function sendMessageWithAttachments(
  conversationId: string,
  type: "IMAGE" | "FILE",
  attachmentIds: string[],
  token?: string | null,
  caption?: string,
  clientMessageId?: string,
): Promise<MessageDto> {
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      type,
      attachment_ids: attachmentIds,
      caption,
      ...(clientMessageId ? { client_message_id: clientMessageId } : {}),
    },
    { headers: getAuthHeaders(token) },
  );
  return normalizeMessageDto(unwrap<MessageDto>(res));
}

export interface AttachmentSessionDto {
  id: string;
  conversationId: string;
  status: "CREATED" | "UPLOADING" | "READY" | "COMPLETED" | "ABANDONED";
  expiresAt: string;
  attachments: AttachmentDto[];
}

export async function createAttachmentSession(
  conversationId: string,
  token?: string | null,
): Promise<AttachmentSessionDto> {
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/attachment-sessions`,
    {},
    { headers: getAuthHeaders(token) },
  );
  return unwrap<AttachmentSessionDto>(res);
}

export async function uploadToAttachmentSession(
  sessionId: string,
  file: File,
  token?: string | null,
  onProgress?: (pct: number) => void,
): Promise<AttachmentDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post(
    `/messaging/attachment-sessions/${encodeURIComponent(sessionId)}/attachments`,
    form,
    {
      headers: { ...getAuthHeaders(token), "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );
  return unwrap<AttachmentDto>(res);
}

export async function completeAttachmentSession(
  sessionId: string,
  token?: string | null,
): Promise<AttachmentSessionDto> {
  const res = await client.post(
    `/messaging/attachment-sessions/${encodeURIComponent(sessionId)}/complete`,
    {},
    { headers: getAuthHeaders(token) },
  );
  return unwrap<AttachmentSessionDto>(res);
}

export async function abandonAttachmentSession(
  sessionId: string,
  token?: string | null,
): Promise<void> {
  await client.delete(
    `/messaging/attachment-sessions/${encodeURIComponent(sessionId)}`,
    { headers: getAuthHeaders(token) },
  );
}

export async function sendMessageWithSession(
  conversationId: string,
  type: "IMAGE" | "FILE",
  sessionId: string,
  token?: string | null,
  caption?: string,
  clientMessageId?: string,
): Promise<MessageDto> {
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      type,
      session_id: sessionId,
      caption,
      ...(clientMessageId ? { client_message_id: clientMessageId } : {}),
    },
    { headers: getAuthHeaders(token) },
  );
  return normalizeMessageDto(unwrap<MessageDto>(res));
}

export async function uploadAttachment(
  conversationId: string,
  file: File,
  token?: string | null,
  onProgress?: (pct: number) => void,
): Promise<AttachmentDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/attachments`,
    form,
    {
      headers: { ...getAuthHeaders(token), "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );
  return unwrap<AttachmentDto>(res);
}

export async function getAttachment(
  conversationId: string,
  attachmentId: string,
  token?: string | null,
): Promise<AttachmentDto> {
  const res = await client.get(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { headers: getAuthHeaders(token) },
  );
  return unwrap<AttachmentDto>(res);
}

export type SearchResultType = "message" | "file" | "photo" | "link" | "card";

export interface ConversationSearchResult {
  messageId: string;
  conversationSequence: number;
  resultType: SearchResultType;
  highlight: string;
  snippet: string;
  createdAt: string;
}

export async function searchConversation(
  conversationId: string,
  q: string,
  token?: string | null,
  types?: SearchResultType[],
): Promise<ConversationSearchResult[]> {
  const res = await client.get(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/search`,
    {
      headers: getAuthHeaders(token),
      params: {
        q,
        ...(types?.length ? { types: types.join(",") } : {}),
      },
    },
  );
  return unwrap<ConversationSearchResult[]>(res);
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

export async function getConversationByBooking(
  bookingId: string,
  token?: string | null,
): Promise<ConversationListResponse | null> {
  try {
    const res = await client.get(
      `/messaging/conversations/by-booking/${encodeURIComponent(bookingId)}`,
      { headers: getAuthHeaders(token) },
    );
    const data = unwrap<ConversationListResponse | null>(res);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function ensureConversationForBooking(
  bookingId: string,
  token?: string | null,
): Promise<ConversationListResponse> {
  const res = await client.post(
    `/messaging/conversations/ensure-for-booking/${encodeURIComponent(bookingId)}`,
    {},
    { headers: getAuthHeaders(token) },
  );
  return unwrap<ConversationListResponse>(res);
}

export async function openConversationForBooking(
  bookingId: string,
  token?: string | null,
): Promise<ConversationListResponse> {
  const existing = await getConversationByBooking(bookingId, token);
  if (existing) return existing;
  return ensureConversationForBooking(bookingId, token);
}

export async function findConversationForBooking(
  bookingId: string,
  bookingReference: string | null | undefined,
  token?: string | null,
): Promise<ConversationListResponse | null> {
  try {
    return await openConversationForBooking(bookingId, token);
  } catch {
    /* fall through */
  }

  if (bookingReference?.trim()) {
    const byRef = await listConversations(token, "all", bookingReference.trim());
    if (byRef.length > 0) return byRef[0];
  }

  const byId = await listConversations(token, "all", bookingId);
  if (byId.length > 0) return byId[0];

  return null;
}
