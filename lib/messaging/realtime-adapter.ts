/**
 * Adaptive idle-aware polling for messaging sync.
 * Conversation open: 5s active, 10s idle 30s–5min, 20s after 5min.
 * Inbox only: 30s. Background: off.
 */

export type RealtimeMode = "conversation" | "inbox" | "off";

export type RealtimePollHandler = () => void | Promise<void>;

const ACTIVE_MS = 5_000;
const IDLE_MS = 10_000;
const VERY_IDLE_MS = 20_000;
const INBOX_MS = 30_000;

const ACTIVE_THRESHOLD_MS = 30_000;
const IDLE_THRESHOLD_MS = 5 * 60_000;

export class MessagingRealtimeAdapter {
  private mode: RealtimeMode = "off";
  private handler: RealtimePollHandler | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityAt = Date.now();
  private visible = true;

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", this.onFocus);
      window.addEventListener("blur", this.onBlur);
    }
  }

  private onVisibility = () => {
    this.visible = document.visibilityState === "visible";
    if (!this.visible) {
      this.stopTimer();
    } else if (this.mode !== "off" && this.handler) {
      void this.tick();
      this.scheduleNext();
    }
  };

  private onFocus = () => {
    this.visible = true;
    this.bumpActivity();
    if (this.mode !== "off" && this.handler) {
      void this.tick();
      this.scheduleNext();
    }
  };

  private onBlur = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      this.visible = false;
      this.stopTimer();
    }
  };

  /** Reserved for future typing indicators. */
  getTransientState(): Record<string, never> {
    return {};
  }

  bumpActivity(): void {
    this.lastActivityAt = Date.now();
  }

  start(mode: RealtimeMode, handler: RealtimePollHandler): void {
    this.mode = mode;
    this.handler = handler;
    this.bumpActivity();
    this.stopTimer();
    if (mode !== "off" && this.visible) {
      void this.tick();
      this.scheduleNext();
    }
  }

  stop(): void {
    this.mode = "off";
    this.handler = null;
    this.stopTimer();
  }

  dispose(): void {
    this.stop();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibility);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", this.onFocus);
      window.removeEventListener("blur", this.onBlur);
    }
  }

  private intervalMs(): number {
    if (this.mode === "off" || !this.visible) return 0;
    if (this.mode === "inbox") return INBOX_MS;

    const idle = Date.now() - this.lastActivityAt;
    if (idle < ACTIVE_THRESHOLD_MS) return ACTIVE_MS;
    if (idle < IDLE_THRESHOLD_MS) return IDLE_MS;
    return VERY_IDLE_MS;
  }

  private stopTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    this.stopTimer();
    const ms = this.intervalMs();
    if (ms <= 0 || !this.handler) return;
    this.timer = setTimeout(() => {
      void this.tick();
      this.scheduleNext();
    }, ms);
  }

  private async tick(): Promise<void> {
    if (!this.handler || this.mode === "off" || !this.visible) return;
    try {
      await this.handler();
    } catch {
      /* polling errors are non-fatal */
    }
  }
}

let sharedAdapter: MessagingRealtimeAdapter | null = null;

export function getMessagingRealtimeAdapter(): MessagingRealtimeAdapter {
  if (!sharedAdapter) {
    sharedAdapter = new MessagingRealtimeAdapter();
  }
  return sharedAdapter;
}
