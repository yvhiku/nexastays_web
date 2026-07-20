import { isGuideFinished } from "@/lib/guidance-storage";
import { isAndroidBrowser } from "@/lib/pwa-platform";

const ENGAGE_KEY = "nexa-pwa-engagement";
const DISMISS_UNTIL_KEY = "nexa-pwa-dismissed-until";
const INSTALLED_KEY = "nexa-pwa-installed";
const WELCOME_SEEN_KEY = "nexa-pwa-welcome-seen";
const LEGACY_DISMISS_KEY = "nexa-pwa-install-dismissed";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const DISMISS_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type InstallPromptContext =
  | "browse"
  | "wishlist"
  | "booking"
  | "host_submit"
  | "host_approved"
  | "host_dashboard"
  | "return"
  | "default";

export type PwaEngagement = {
  listingViews: string[];
  pageViews: string[];
  firstSeenAt: number;
  lastActiveAt: number;
  sessionCount: number;
  wishlistSaved: boolean;
  bookingCompleted: boolean;
  listingSubmitted: boolean;
  hostApproved: boolean;
  hostDashboardOpens: number;
  installContext: InstallPromptContext;
};

function emptyEngagement(): PwaEngagement {
  const now = Date.now();
  return {
    listingViews: [],
    pageViews: [],
    firstSeenAt: now,
    lastActiveAt: now,
    sessionCount: 1,
    wishlistSaved: false,
    bookingCompleted: false,
    listingSubmitted: false,
    hostApproved: false,
    hostDashboardOpens: 0,
    installContext: "default",
  };
}

function sameCalendarDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function migrate(raw: Record<string, unknown>): PwaEngagement {
  const base = emptyEngagement();
  const contexts: InstallPromptContext[] = [
    "browse",
    "wishlist",
    "booking",
    "host_submit",
    "host_approved",
    "host_dashboard",
    "return",
    "default",
  ];
  const ctx = raw.installContext;
  return {
    listingViews: Array.isArray(raw.listingViews)
      ? (raw.listingViews as string[]).filter((x) => typeof x === "string")
      : [],
    pageViews: Array.isArray(raw.pageViews)
      ? (raw.pageViews as string[]).filter((x) => typeof x === "string")
      : [],
    firstSeenAt: typeof raw.firstSeenAt === "number" ? raw.firstSeenAt : base.firstSeenAt,
    lastActiveAt: typeof raw.lastActiveAt === "number" ? raw.lastActiveAt : base.lastActiveAt,
    sessionCount: typeof raw.sessionCount === "number" ? raw.sessionCount : 1,
    wishlistSaved: Boolean(raw.wishlistSaved),
    bookingCompleted: Boolean(raw.bookingCompleted),
    listingSubmitted: Boolean(raw.listingSubmitted),
    hostApproved: Boolean(raw.hostApproved),
    hostDashboardOpens:
      typeof raw.hostDashboardOpens === "number"
        ? raw.hostDashboardOpens
        : raw.hostDashboard
          ? 1
          : 0,
    installContext:
      typeof ctx === "string" && contexts.includes(ctx as InstallPromptContext)
        ? (ctx as InstallPromptContext)
        : "default",
  };
}

function read(): PwaEngagement {
  if (typeof window === "undefined") return emptyEngagement();
  try {
    const raw = localStorage.getItem(ENGAGE_KEY);
    if (!raw) {
      const fresh = emptyEngagement();
      localStorage.setItem(ENGAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return migrate(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return emptyEngagement();
  }
}

function write(data: PwaEngagement) {
  try {
    localStorage.setItem(ENGAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("nexa-pwa-engagement-changed"));
  } catch {
    /* ignore */
  }
}

function setContext(data: PwaEngagement, ctx: InstallPromptContext) {
  data.installContext = ctx;
}

/** Bump return-visit session when idle >30m or calendar day changed. */
export function touchPwaSession() {
  const data = read();
  const now = Date.now();
  const idle = now - (data.lastActiveAt || data.firstSeenAt || now);
  const dayChanged = !sameCalendarDay(data.lastActiveAt || data.firstSeenAt, now);
  if (idle > SESSION_IDLE_MS || dayChanged) {
    data.sessionCount = Math.max(1, data.sessionCount || 1) + 1;
    if (data.sessionCount >= 2) setContext(data, "return");
  }
  data.lastActiveAt = now;
  write(data);
}

export function trackPwaPageView(path: string) {
  touchPwaSession();
  const data = read();
  if (!data.pageViews.includes(path)) {
    data.pageViews = [...data.pageViews, path].slice(-20);
  }
  write(data);
}

/** Distinct listing detail views for install eligibility (≥2). */
export function recordListingViewForInstall(listingId: string) {
  if (!listingId) return;
  touchPwaSession();
  const data = read();
  const before = data.listingViews.length;
  if (!data.listingViews.includes(listingId)) {
    data.listingViews = [...data.listingViews, listingId].slice(-30);
  }
  if (before < 2 && data.listingViews.length >= 2) {
    setContext(data, "browse");
  }
  write(data);
}

export function markPwaWishlistSaved() {
  const data = read();
  data.wishlistSaved = true;
  setContext(data, "wishlist");
  write(data);
}

export function markPwaBookingCompleted() {
  const data = read();
  data.bookingCompleted = true;
  setContext(data, "booking");
  write(data);
}

export function markPwaListingSubmitted() {
  const data = read();
  data.listingSubmitted = true;
  setContext(data, "host_submit");
  write(data);
}

export function markPwaHostApproved() {
  const data = read();
  if (!data.hostApproved) {
    data.hostApproved = true;
    setContext(data, "host_approved");
    write(data);
  }
}

/** Count host dashboard opens; eligible at 3+. */
export function markPwaHostDashboardOpen() {
  const data = read();
  data.hostDashboardOpens = (data.hostDashboardOpens || 0) + 1;
  if (data.hostDashboardOpens >= 3) {
    setContext(data, "host_dashboard");
  }
  write(data);
}

/** @deprecated use markPwaHostDashboardOpen */
export function markPwaHostDashboard() {
  markPwaHostDashboardOpen();
}

export function getInstallPromptContext(): InstallPromptContext {
  return read().installContext || "default";
}

/**
 * Persist installed flag. Prefer calling via `lib/pwa-install-state` on `appinstalled`
 * (or standalone sync) — UI must not call this on userChoice.accepted alone.
 */
export function markPwaInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
    localStorage.removeItem(DISMISS_UNTIL_KEY);
    localStorage.removeItem(LEGACY_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

/** Clear install + dismiss + welcome flags (NexaDebug.reset). */
export function resetPwaEngagementFlags() {
  try {
    localStorage.removeItem(INSTALLED_KEY);
    localStorage.removeItem(DISMISS_UNTIL_KEY);
    localStorage.removeItem(LEGACY_DISMISS_KEY);
    localStorage.removeItem(WELCOME_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

export function isPwaMarkedInstalled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function isPwaWelcomeSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markPwaWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function isDismissedUntilActive(): boolean {
  try {
    // Migrate legacy permanent dismiss → 30 days from now once
    if (localStorage.getItem(LEGACY_DISMISS_KEY) === "1") {
      const until = Date.now() + DISMISS_DAYS_MS;
      localStorage.setItem(DISMISS_UNTIL_KEY, String(until));
      localStorage.removeItem(LEGACY_DISMISS_KEY);
    }
    const raw = localStorage.getItem(DISMISS_UNTIL_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

function isEligibleByAction(): boolean {
  const data = read();
  return (
    data.listingViews.length >= 2 ||
    data.wishlistSaved ||
    data.bookingCompleted ||
    data.listingSubmitted ||
    data.hostApproved ||
    (data.hostDashboardOpens || 0) >= 3 ||
    (data.sessionCount || 1) >= 2
  );
}

/** Android first visit: offer install right after the welcome guide. */
export function shouldOfferAndroidInstallAfterWelcome(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay() || isPwaMarkedInstalled()) return false;
  if (isDismissedUntilActive()) return false;
  if (!isAndroidBrowser() || isIosSafari()) return false;
  if (isGuideFinished("install_app") || isGuideFinished("install_success")) return false;
  return true;
}

/**
 * Install prompt gate: value action OR Android post-welcome, and not dismissed / installed / standalone.
 */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay() || isPwaMarkedInstalled()) return false;
  if (isDismissedUntilActive()) return false;
  return isEligibleByAction() || shouldOfferAndroidInstallAfterWelcome();
}

/** Profile can always offer install when not already installed / standalone. */
export function canOfferInstallFromSettings(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay() || isPwaMarkedInstalled()) return false;
  return true;
}

/** Not now — silent for 30 days. */
export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + DISMISS_DAYS_MS));
    localStorage.removeItem(LEGACY_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const chrome = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && !chrome;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}
