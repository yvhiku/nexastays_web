/**
 * Optimistic send queue with client_message_id idempotency.
 */

import { sendMessage, type MessageDto } from "./messages-api";

const QUEUE_KEY = "nexa_messaging_offline_queue";

export interface QueuedMessage {
  conversationId: string;
  body: string;
  clientMessageId: string;
  createdAt: string;
}

function readQueue(): QueuedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      localStorage.removeItem(QUEUE_KEY);
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    }
  } catch {
    /* ignore */
  }
}

export function createClientMessageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cmid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildOptimisticMessage(
  conversationId: string,
  body: string,
  clientMessageId: string,
  senderId: string | null,
): MessageDto {
  const now = new Date().toISOString();
  return {
    id: `optimistic_${clientMessageId}`,
    conversationId,
    conversationSequence: Number.MAX_SAFE_INTEGER,
    senderId,
    type: "TEXT",
    body,
    metadata: { source: "USER", schemaVersion: 1, cardVersion: 1, presentationVersion: 1 },
    status: "PENDING",
    sentAt: null,
    deliveredAt: null,
    readAt: null,
    isSystem: false,
    clientMessageId,
    createdAt: now,
    isOwn: true,
    presentationVersion: 1,
  };
}

export function enqueueOffline(item: QueuedMessage): void {
  const queue = readQueue();
  if (!queue.some((q) => q.clientMessageId === item.clientMessageId)) {
    queue.push(item);
    writeQueue(queue);
  }
}

export function dequeueOffline(clientMessageId: string): void {
  writeQueue(readQueue().filter((q) => q.clientMessageId !== clientMessageId));
}

export function getOfflineQueue(): QueuedMessage[] {
  return readQueue();
}

export async function flushOfflineQueue(
  token: string | null,
  onSent?: (item: QueuedMessage, message: MessageDto) => void,
): Promise<void> {
  if (!token) return;
  const queue = readQueue();
  for (const item of queue) {
    try {
      const message = await sendMessage(
        item.conversationId,
        item.body,
        token,
        item.clientMessageId,
      );
      dequeueOffline(item.clientMessageId);
      onSent?.(item, message);
    } catch {
      break;
    }
  }
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
