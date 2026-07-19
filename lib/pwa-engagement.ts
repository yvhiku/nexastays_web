const ENGAGE_KEY = "nexa-pwa-engagement";
const DISMISS_KEY = "nexa-pwa-install-dismissed";
const INSTALLED_KEY = "nexa-pwa-installed";
const SESSION_IDLE_MS = 30 * 60 * 1000;

export type PwaEngagement = {
  listingViews: string[];
  pageViews: string[];
  firstSeenAt: number;
  lastActiveAt: number;
  sessionCount: number;
  wishlistSaved: boolean;
  bookingCompleted: boolean;
  hostDashboard: boolean;
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
    hostDashboard: false,
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
    hostDashboard: Boolean(raw.hostDashboard),
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
  } catch {
    /* ignore */
  }
}

/** Bump return-visit session when idle >30m or calendar day changed. */
export function touchPwaSession() {
  const data = read();
  const now = Date.now();
  const idle = now - (data.lastActiveAt || data.firstSeenAt || now);
  const dayChanged = !sameCalendarDay(data.lastActiveAt || data.firstSeenAt, now);
  if (idle > SESSION_IDLE_MS || dayChanged) {
    data.sessionCount = Math.max(1, data.sessionCount || 1) + 1;
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
  if (path.includes("/host/dashboard")) data.hostDashboard = true;
  write(data);
}

/** Distinct listing detail views for install eligibility (≥2). */
export function recordListingViewForInstall(listingId: string) {
  if (!listingId) return;
  touchPwaSession();
  const data = read();
  if (!data.listingViews.includes(listingId)) {
    data.listingViews = [...data.listingViews, listingId].slice(-30);
  }
  write(data);
}

export function markPwaWishlistSaved() {
  const data = read();
  data.wishlistSaved = true;
  write(data);
}

export function markPwaBookingCompleted() {
  const data = read();
  data.bookingCompleted = true;
  write(data);
}

export function markPwaHostDashboard() {
  const data = read();
  data.hostDashboard = true;
  write(data);
}

export function markPwaInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
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

function isEligibleByAction(): boolean {
  const data = read();
  return (
    data.listingViews.length >= 2 ||
    data.wishlistSaved ||
    data.bookingCompleted ||
    data.hostDashboard ||
    (data.sessionCount || 1) >= 2
  );
}

/**
 * Floating popup gate: meaningful action + not dismissed/installed/standalone.
 * Profile App entry ignores dismiss — use canOfferInstallFromSettings().
 */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay() || isPwaMarkedInstalled()) return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  return isEligibleByAction();
}

/** Profile can always offer install when not already installed / standalone. */
export function canOfferInstallFromSettings(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay() || isPwaMarkedInstalled()) return false;
  return true;
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
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
