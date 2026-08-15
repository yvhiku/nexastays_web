/**
 * Nexa Stays messaging API (stays service) — v3 presentation model.
 */

import axios from "axios";
import {
  normalizeMessageDto,
  normalizeMessages,
  type MessageDto,
  type AttachmentDto,
} from "./message-normalize";
import { getStaysApiBaseUrl } from "../env";
import { bearerAuthHeaders } from "../access-token-store";
import { attachBrowserBearerAuth } from "../attach-browser-bearer-auth";

const API_BASE = getStaysApiBaseUrl();
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
  viewerRole?: "guest" | "host";
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
  postStayEndsAt?: string | null;
  autoArchiveDisabled?: boolean;
  archiveReason?: string | null;
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

export type InboxFilter = "active" | "unread" | "support" | "archived" | "all" | "hosts";

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
  filter: InboxFilter = "active",
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

export type ConversationReportCategory =
  | "SPAM_SCAM"
  | "HARASSMENT"
  | "SUSPICIOUS_ACTIVITY"
  | "MISLEADING_INFORMATION"
  | "OTHER";

export type SafetyIssueCategory =
  | "FEEL_UNSAFE"
  | "SUSPICIOUS_FRAUDULENT"
  | "PROPERTY_PROBLEM"
  | "THREATS_HARASSMENT"
  | "OTHER";

export interface SafetyIssueInput {
  category: SafetyIssueCategory;
  details?: string;
  attachmentIds?: string[];
}

export interface ConversationReportInput {
  reason: string;
  attachmentIds?: string[];
}

export type ReportConversationResult = {
  ok: boolean;
  reportId?: string;
  ticketId?: string;
  ticketNumber?: string;
  supportConversationId?: string;
};

export type SafetyIssueResult = {
  supportUrl?: string;
  safetyIssueId?: string;
  ticketId?: string;
  ticketNumber?: string;
  supportConversationId?: string;
};

function asSupportThreadFields(raw: Record<string, unknown>) {
  return {
    ticketId: (raw.ticketId ?? raw.ticket_id) as string | undefined,
    ticketNumber: (raw.ticketNumber ?? raw.ticket_number) as string | undefined,
    supportConversationId: (raw.supportConversationId ??
      raw.support_conversation_id) as string | undefined,
  };
}

export async function reportConversation(
  conversationId: string,
  input: ConversationReportInput | string | undefined,
  token?: string | null,
): Promise<ReportConversationResult> {
  const payload =
    typeof input === "string" || input === undefined
      ? { reason: input ?? "" }
      : {
          reason: input.reason,
          ...(input.attachmentIds?.length
            ? { attachmentIds: input.attachmentIds }
            : {}),
        };
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/report`,
    payload,
    { headers: getAuthHeaders(token) },
  );
  const raw = unwrap<Record<string, unknown>>(res);
  return {
    ok: Boolean(raw.ok ?? true),
    reportId: (raw.reportId ?? raw.report_id) as string | undefined,
    ...asSupportThreadFields(raw),
  };
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

export async function uploadReportEvidence(
  conversationId: string,
  file: File,
  token?: string | null,
  onProgress?: (pct: number) => void,
): Promise<AttachmentDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/report-evidence`,
    form,
    {
      headers: getAuthHeaders(token),
      transformRequest: [
        (data, headers) => {
          if (typeof FormData !== "undefined" && data instanceof FormData) {
            // Drop axios default application/json so the browser sets multipart boundary.
            delete (headers as Record<string, unknown>)["Content-Type"];
          }
          return data;
        },
      ],
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );
  return unwrap<AttachmentDto>(res);
}

export async function reportSafetyIssue(
  conversationId: string,
  input: SafetyIssueInput,
  token?: string | null,
): Promise<SafetyIssueResult> {
  const details = input.details?.trim();
  const res = await client.post(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/safety`,
    {
      category: input.category,
      ...(details ? { details: details.slice(0, 500) } : {}),
      ...(input.attachmentIds?.length
        ? { attachmentIds: input.attachmentIds }
        : {}),
    },
    { headers: getAuthHeaders(token) },
  );
  const raw = unwrap<Record<string, unknown>>(res);
  return {
    supportUrl: (raw.supportUrl ?? raw.support_url) as string | undefined,
    safetyIssueId: (raw.safetyIssueId ?? raw.safety_issue_id) as
      | string
      | undefined,
    ...asSupportThreadFields(raw),
  };
}

export type SupportTicketCategory =
  | "BOOKING"
  | "PAYMENT"
  | "REFUND"
  | "CANCELLATION"
  | "HOST"
  | "GUEST"
  | "LISTING"
  | "KYC"
  | "TECHNICAL"
  | "FRAUD"
  | "OTHER";

export interface CreateSupportTicketInput {
  category: SupportTicketCategory;
  subject: string;
  message: string;
  bookingId?: string;
  listingId?: string;
  reportId?: string;
  safetyIssueId?: string;
  clientRequestId?: string;
}

export interface CreateSupportTicketResult {
  id: string;
  ticket_number: string;
  conversation_id: string;
  status: string;
  category: string;
  subject: string;
  party: string;
  created_at: string;
}

export async function createSupportTicket(
  input: CreateSupportTicketInput,
  token?: string | null,
): Promise<CreateSupportTicketResult> {
  const res = await client.post(
    "/support/tickets",
    {
      category: input.category,
      subject: input.subject,
      message: input.message,
      ...(input.bookingId ? { bookingId: input.bookingId } : {}),
      ...(input.listingId ? { listingId: input.listingId } : {}),
      ...(input.reportId ? { reportId: input.reportId } : {}),
      ...(input.safetyIssueId ? { safetyIssueId: input.safetyIssueId } : {}),
      ...(input.clientRequestId
        ? { clientRequestId: input.clientRequestId }
        : {}),
    },
    { headers: getAuthHeaders(token) },
  );
  return unwrap<CreateSupportTicketResult>(res);
}

export type SupportTicketListItem = {
  id: string;
  status: string;
  conversation_id?: string;
  subject?: string;
};

export async function listSupportTickets(
  token?: string | null,
  limit = 50,
): Promise<SupportTicketListItem[]> {
  const res = await client.get(`/support/tickets?limit=${limit}`, {
    headers: getAuthHeaders(token),
  });
  const data = unwrap<{ items?: Record<string, unknown>[] }>(res);
  return (data.items ?? []).map((row) => ({
    id: String(row.id ?? ""),
    status: String(row.status ?? ""),
    conversation_id: (row.conversation_id ?? row.conversationId) as
      | string
      | undefined,
    subject: row.subject as string | undefined,
  }));
}

export type SupportCsatAgent = {
  id: string;
  fullName: string | null;
  profilePhotoUrl: string | null;
};

export type SupportCsatState = {
  submitted: boolean;
  alreadyReviewed: boolean;
  canReview: boolean;
  ticketStatus: string;
  agent: SupportCsatAgent | null;
  csat: {
    rating: number;
    comment: string | null;
    agent_rating: number | null;
    agent_id: string | null;
    submitted_at: string;
  } | null;
};

function mapSupportCsatState(data: Record<string, unknown>): SupportCsatState {
  const csat = data.csat as Record<string, unknown> | null | undefined;
  const agent = data.agent as Record<string, unknown> | null | undefined;
  return {
    submitted: Boolean(data.submitted ?? data.alreadyReviewed),
    alreadyReviewed: Boolean(data.alreadyReviewed ?? data.submitted),
    canReview: Boolean(data.canReview),
    ticketStatus: String(data.ticketStatus ?? data.ticket_status ?? ""),
    agent: agent
      ? {
          id: String(agent.id ?? ""),
          fullName: (agent.fullName as string | null) ?? null,
          profilePhotoUrl: (agent.profilePhotoUrl as string | null) ?? null,
        }
      : null,
    csat: csat
      ? {
          rating: Number(csat.rating ?? 0),
          comment: (csat.comment as string | null) ?? null,
          agent_rating:
            csat.agent_rating == null && csat.agentRating == null
              ? null
              : Number(csat.agent_rating ?? csat.agentRating),
          agent_id:
            csat.agent_id == null && csat.agentId == null
              ? null
              : String(csat.agent_id ?? csat.agentId),
          submitted_at: String(csat.submitted_at ?? csat.submittedAt ?? ""),
        }
      : null,
  };
}

export async function getSupportTicketCsat(
  ticketId: string,
  token?: string | null,
): Promise<SupportCsatState> {
  const res = await client.get(
    `/support/tickets/${encodeURIComponent(ticketId)}/csat`,
    { headers: getAuthHeaders(token) },
  );
  return mapSupportCsatState(unwrap<Record<string, unknown>>(res));
}

export async function submitSupportTicketCsat(
  ticketId: string,
  input: { rating: number; comment?: string; agentRating?: number },
  token?: string | null,
): Promise<SupportCsatState> {
  const res = await client.post(
    `/support/tickets/${encodeURIComponent(ticketId)}/csat`,
    {
      rating: input.rating,
      ...(input.agentRating != null ? { agentRating: input.agentRating } : {}),
      ...(input.comment?.trim() ? { comment: input.comment.trim() } : {}),
    },
    { headers: getAuthHeaders(token) },
  );
  return mapSupportCsatState(unwrap<Record<string, unknown>>(res));
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
