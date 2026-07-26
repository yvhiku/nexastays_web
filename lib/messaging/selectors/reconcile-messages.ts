import type { AttachmentDto, MessageDto, SignedMedia } from "../messages-api";

function messageKey(m: MessageDto): string {
  return m.clientMessageId ?? m.id;
}

export function messageRenderKey(message: MessageDto): string {
  return message.clientMessageId
    ? `client:${message.clientMessageId}`
    : `message:${message.id}`;
}

function stableMedia(
  previous: SignedMedia | null | undefined,
  incoming: SignedMedia | null | undefined,
  preferIncoming: boolean,
): SignedMedia | null | undefined {
  if (!previous || !incoming || preferIncoming) return incoming;
  return previous.version === incoming.version ? previous : incoming;
}

function stableAttachment(
  previous: AttachmentDto | undefined,
  incoming: AttachmentDto,
  preferIncoming: boolean,
): AttachmentDto {
  if (!previous || previous.id !== incoming.id) return incoming;
  const candidate: AttachmentDto = {
    ...incoming,
    thumbnail: stableMedia(previous.thumbnail, incoming.thumbnail, preferIncoming) ?? null,
    full: stableMedia(previous.full, incoming.full, preferIncoming) ?? null,
    original: stableMedia(previous.original, incoming.original, preferIncoming),
  };
  const unchanged =
    previous.status === candidate.status &&
    previous.processingStatus === candidate.processingStatus &&
    previous.virusScanStatus === candidate.virusScanStatus &&
    previous.sessionId === candidate.sessionId &&
    previous.mediaAssetId === candidate.mediaAssetId &&
    previous.mime === candidate.mime &&
    previous.sizeBytes === candidate.sizeBytes &&
    previous.width === candidate.width &&
    previous.height === candidate.height &&
    previous.orientation === candidate.orientation &&
    previous.durationMs === candidate.durationMs &&
    previous.checksum === candidate.checksum &&
    previous.blurhash === candidate.blurhash &&
    previous.originalFilename === candidate.originalFilename &&
    previous.thumbnail === candidate.thumbnail &&
    previous.full === candidate.full &&
    previous.original === candidate.original;
  return unchanged ? previous : candidate;
}

function stableMessage(
  previous: MessageDto,
  incoming: MessageDto,
  preferIncomingAttachments: boolean,
): MessageDto {
  const previousById = new Map(
    previous.attachments.map((attachment) => [attachment.id, attachment]),
  );
  const attachments = incoming.attachments.map((attachment) =>
    stableAttachment(
      previousById.get(attachment.id),
      attachment,
      preferIncomingAttachments,
    ),
  );
  const stableAttachments =
    attachments.length === previous.attachments.length &&
    attachments.every((attachment, index) => attachment === previous.attachments[index])
      ? previous.attachments
      : attachments;
  const payload =
    "attachments" in incoming.payload && incoming.payload.attachments
      ? { ...incoming.payload, attachments: stableAttachments }
      : incoming.payload;
  const candidate = {
    ...incoming,
    attachments: stableAttachments,
    payload,
  };
  const unchanged =
    previous.id === candidate.id &&
    previous.conversationId === candidate.conversationId &&
    previous.conversationSequence === candidate.conversationSequence &&
    previous.senderId === candidate.senderId &&
    previous.type === candidate.type &&
    previous.body === candidate.body &&
    previous.status === candidate.status &&
    previous.deliveryState === candidate.deliveryState &&
    previous.sentAt === candidate.sentAt &&
    previous.deliveredAt === candidate.deliveredAt &&
    previous.readAt === candidate.readAt &&
    previous.isSystem === candidate.isSystem &&
    previous.clientMessageId === candidate.clientMessageId &&
    previous.createdAt === candidate.createdAt &&
    previous.isOwn === candidate.isOwn &&
    previous.presentationVersion === candidate.presentationVersion &&
    previous.attachments === candidate.attachments &&
    JSON.stringify(previous.metadata) === JSON.stringify(candidate.metadata) &&
    JSON.stringify(previous.payload) === JSON.stringify(candidate.payload);
  return unchanged ? previous : candidate;
}

/** Merge persisted message in-place by client_message_id (no delete+insert jump). */
export function reconcileOptimisticMessage(
  messages: MessageDto[],
  persisted: MessageDto,
): MessageDto[] {
  const key = persisted.clientMessageId ?? persisted.id;
  const idx = messages.findIndex(
    (m) => m.clientMessageId === key || m.id === `optimistic_${key}` || m.id === key,
  );
  if (idx >= 0) {
    const next = [...messages];
    next[idx] = { ...persisted, isOwn: true };
    return next;
  }
  return [...messages, persisted];
}

export function patchOptimisticByClientId(
  messages: MessageDto[],
  clientMessageId: string,
  patch: Partial<MessageDto> & { metadata?: Record<string, unknown> },
): MessageDto[] {
  return messages.map((m) => {
    if (m.clientMessageId !== clientMessageId && m.id !== `optimistic_${clientMessageId}`) {
      return m;
    }
    return {
      ...m,
      ...patch,
      metadata: patch.metadata ? { ...m.metadata, ...patch.metadata } : m.metadata,
    };
  });
}

export function mergeMessages(
  existing: MessageDto[],
  incoming: MessageDto[],
  options?: { preferIncomingAttachments?: boolean },
): MessageDto[] {
  const map = new Map<string, MessageDto>();
  for (const m of existing) map.set(messageKey(m), m);
  for (const m of incoming) {
    const key = messageKey(m);
    const prev = map.get(key);
    if (prev && prev.id.startsWith("optimistic_")) {
      map.set(
        key,
        stableMessage(prev, { ...m, isOwn: prev.isOwn }, true),
      );
    } else if (prev) {
      const preferIncoming =
        options?.preferIncomingAttachments ||
        (m.attachments.length > 0 && prev.attachments.some((a) => a.id.startsWith("optimistic_")));
      const keepPrevAttachments =
        !preferIncoming && prev.attachments.length > m.attachments.length;
      map.set(
        key,
        stableMessage(
          prev,
          keepPrevAttachments ? { ...m, attachments: prev.attachments } : m,
          Boolean(options?.preferIncomingAttachments),
        ),
      );
    } else {
      map.set(key, m);
    }
  }
  const merged = [...map.values()].sort(
    (a, b) => a.conversationSequence - b.conversationSequence,
  );
  return merged.length === existing.length &&
    merged.every((message, index) => message === existing[index])
    ? existing
    : merged;
}
