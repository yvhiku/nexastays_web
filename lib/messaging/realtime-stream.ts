import { getStaysApiBaseUrl } from "@/lib/env";

export type MessagingRealtimeEvent = {
  type: "conversation.changed";
  conversationId: string;
  reason: "MESSAGE_CREATED" | "MESSAGE_DELIVERED" | "MESSAGE_READ";
  messageId?: string;
  emittedAt: string;
};

export function parseSseFrames(input: string): {
  events: MessagingRealtimeEvent[];
  remainder: string;
} {
  const normalized = input.replace(/\r\n/g, "\n");
  const frames = normalized.split("\n\n");
  const remainder = frames.pop() ?? "";
  const events: MessagingRealtimeEvent[] = [];

  for (const frame of frames) {
    const data = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      const parsed = JSON.parse(data) as Partial<MessagingRealtimeEvent>;
      if (
        parsed.type === "conversation.changed" &&
        typeof parsed.conversationId === "string"
      ) {
        events.push(parsed as MessagingRealtimeEvent);
      }
    } catch {
      // A malformed event must not terminate the live stream.
    }
  }

  return { events, remainder };
}

export function subscribeMessagingRealtime(
  token: string,
  onEvent: (event: MessagingRealtimeEvent) => void,
): () => void {
  const controller = new AbortController();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = async (): Promise<void> => {
    try {
      const base = getStaysApiBaseUrl().replace(/\/$/, "");
      const response = await fetch(`${base}/messaging/realtime`, {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403 || !response.body) {
        return;
      }
      if (!response.ok) throw new Error(`Realtime stream failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const parsed = parseSseFrames(buffer);
        buffer = parsed.remainder;
        parsed.events.forEach(onEvent);
        if (done) break;
      }
    } catch {
      // Polling remains active while the stream is unavailable.
    }

    if (!controller.signal.aborted) {
      reconnectTimer = setTimeout(() => void connect(), 1_500);
    }
  };

  void connect();

  return () => {
    controller.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };
}
