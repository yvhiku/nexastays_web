import type { MessageDto } from "../messages-api";

function messageKey(m: MessageDto): string {
  return m.clientMessageId ?? m.id;
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
      map.set(key, { ...m, isOwn: prev.isOwn });
    } else if (prev) {
      const preferIncoming =
        options?.preferIncomingAttachments ||
        (m.attachments.length > 0 && prev.attachments.some((a) => a.id.startsWith("optimistic_")));
      const keepPrevAttachments =
        !preferIncoming && prev.attachments.length > m.attachments.length;
      map.set(key, keepPrevAttachments ? { ...m, attachments: prev.attachments } : m);
    } else {
      map.set(key, m);
    }
  }
  return [...map.values()].sort((a, b) => a.conversationSequence - b.conversationSequence);
}
