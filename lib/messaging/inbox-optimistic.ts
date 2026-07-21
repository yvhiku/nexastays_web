const STORAGE_KEY = "nexa_messaging_optimistic_activity";
const SYNC_EVENT = "nexa-inbox-optimistic";

export type OptimisticInboxEntry = {
  at: number;
  preview: string;
};

function parseStored(raw: string | null): Record<string, OptimisticInboxEntry> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, OptimisticInboxEntry | number>;
    const next: Record<string, OptimisticInboxEntry> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "number") {
        next[id] = { at: value, preview: "" };
      } else if (value && typeof value === "object" && typeof value.at === "number") {
        next[id] = {
          at: value.at,
          preview: typeof value.preview === "string" ? value.preview : "",
        };
      }
    }
    return next;
  } catch {
    return {};
  }
}

export function readOptimisticInboxMap(): Record<string, OptimisticInboxEntry> {
  if (typeof window === "undefined") return {};
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

export function setOptimisticInboxActivity(conversationId: string, preview: string): void {
  if (typeof window === "undefined") return;
  const map = readOptimisticInboxMap();
  map[conversationId] = {
    at: Date.now(),
    preview: preview.trim() || "Message",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function subscribeOptimisticInbox(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(SYNC_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SYNC_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function resolveInboxPreview(
  serverPreview: string | null | undefined,
  serverAt: string | null | undefined,
  optimistic?: OptimisticInboxEntry | null,
): string {
  const trimmed = serverPreview?.trim();
  if (!optimistic?.preview) return trimmed || "—";
  const serverTs = serverAt ? new Date(serverAt).getTime() : 0;
  if (optimistic.at >= serverTs) return optimistic.preview;
  return trimmed || "—";
}
