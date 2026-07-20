export type RealtimeMode = "conversation" | "inbox" | "off";

const ACTIVE_MS = 5_000;
const IDLE_MS = 10_000;
const VERY_IDLE_MS = 20_000;
const INBOX_MS = 30_000;

const ACTIVE_THRESHOLD_MS = 30_000;
const IDLE_THRESHOLD_MS = 5 * 60_000;

/** Pure interval calculator for adaptive idle-aware polling (testable). */
export function getPollingIntervalMs(
  mode: RealtimeMode,
  visible: boolean,
  lastActivityAt: number,
  now = Date.now(),
): number {
  if (mode === "off" || !visible) return 0;
  if (mode === "inbox") return INBOX_MS;

  const idle = now - lastActivityAt;
  if (idle < ACTIVE_THRESHOLD_MS) return ACTIVE_MS;
  if (idle < IDLE_THRESHOLD_MS) return IDLE_MS;
  return VERY_IDLE_MS;
}

export const POLL_INTERVALS = {
  ACTIVE_MS,
  IDLE_MS,
  VERY_IDLE_MS,
  INBOX_MS,
  ACTIVE_THRESHOLD_MS,
  IDLE_THRESHOLD_MS,
} as const;
