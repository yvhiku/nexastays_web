export type DeliveryState = "PENDING" | "PERSISTED" | "SENT" | "DELIVERED" | "READ";

export interface AttachmentDto {
  id: string;
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  processingStatus?: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  virusScanStatus?: "PENDING" | "SAFE" | "FAILED";
  sessionId?: string | null;
  mediaAssetId?: string | null;
  mime: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  orientation?: number | null;
  durationMs?: number | null;
  checksum?: string | null;
  blurhash: string | null;
  originalFilename: string | null;
  thumbnail: { url: string; version: number; expiresAt: string } | null;
  full: { url: string; version: number; expiresAt: string } | null;
  original?: { url: string; version: number; expiresAt: string } | null;
}

export interface TextPayload {
  text: string;
}

export interface MediaPayload {
  attachmentIds: string[];
  caption?: string;
  attachments?: AttachmentDto[];
}

export interface TimelineCardPayload {
  kind: string;
  title: string;
  body?: string;
  icon?: string;
  actions?: Array<{
    id: string;
    label: string;
    type: string;
    value?: string;
    url?: string;
  }>;
  coverMediaId?: string | null;
  listingId?: string | null;
  bookingId?: string | null;
  snapshot?: Record<string, unknown>;
}

export type MessagePayload = TextPayload | MediaPayload | TimelineCardPayload;

export interface MessageDto {
  id: string;
  conversationId: string;
  conversationSequence: number;
  senderId: string | null;
  type: string;
  body: string | null;
  metadata: Record<string, unknown>;
  payload: MessagePayload;
  status: string;
  deliveryState: DeliveryState;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  isSystem: boolean;
  clientMessageId: string | null;
  createdAt: string;
  isOwn: boolean;
  presentationVersion: number;
  attachments: AttachmentDto[];
}

export function buildMessagePayloadFromDto(raw: Partial<MessageDto>): MessagePayload {
  if (raw.payload) return raw.payload;

  const type = raw.type ?? "TEXT";
  const meta = raw.metadata ?? {};
  const attachments = raw.attachments ?? [];

  if (type === "TEXT") {
    return { text: raw.body ?? "" };
  }

  if (type === "IMAGE" || type === "FILE") {
    const attachmentIds =
      (meta.attachment_ids as string[] | undefined) ?? attachments.map((a) => a.id);
    return {
      attachmentIds,
      caption: (meta.caption as string | undefined) ?? raw.body ?? undefined,
      attachments,
    };
  }

  const card: TimelineCardPayload = {
    kind: String(meta.kind ?? type.replace(/_CARD$/, "").toLowerCase()),
    title: String(meta.title ?? raw.body ?? ""),
    body: meta.body as string | undefined,
    icon: meta.icon as string | undefined,
    actions: meta.actions as TimelineCardPayload["actions"],
    coverMediaId: meta.coverMediaId as string | null | undefined,
    listingId: meta.listingId as string | null | undefined,
    bookingId: meta.bookingId as string | null | undefined,
    snapshot: meta.snapshot as Record<string, unknown> | undefined,
  };
  return card;
}

export function normalizeMessageDto(raw: Partial<MessageDto>): MessageDto {
  const payload = buildMessagePayloadFromDto(raw);
  const status = raw.status ?? "PERSISTED";
  let deliveryState: DeliveryState = raw.deliveryState ?? "PERSISTED";
  if (!raw.deliveryState) {
    if (status === "READ" || raw.readAt) deliveryState = "READ";
    else if (status === "DELIVERED" || raw.deliveredAt) deliveryState = "DELIVERED";
    else if (raw.sentAt) deliveryState = "SENT";
    else if (status === "PENDING") deliveryState = "PENDING";
    else deliveryState = "PERSISTED";
  }

  return {
    id: raw.id!,
    conversationId: raw.conversationId!,
    conversationSequence: raw.conversationSequence ?? 0,
    senderId: raw.senderId ?? null,
    type: raw.type ?? "TEXT",
    body: raw.body ?? null,
    metadata: raw.metadata ?? {},
    payload,
    status,
    deliveryState,
    sentAt: raw.sentAt ?? null,
    deliveredAt: raw.deliveredAt ?? null,
    readAt: raw.readAt ?? null,
    isSystem: raw.isSystem ?? false,
    clientMessageId: raw.clientMessageId ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    isOwn: raw.isOwn ?? false,
    presentationVersion: raw.presentationVersion ?? 1,
    attachments:
      raw.attachments?.length
        ? raw.attachments
        : ("attachments" in payload && payload.attachments?.length
            ? payload.attachments
            : []),
  };
}

export function normalizeMessages(messages: Partial<MessageDto>[]): MessageDto[] {
  return messages.map((m) => normalizeMessageDto(m));
}
