const ENGAGE_KEY = "nexa-pwa-engagement";
const DISMISS_KEY = "nexa-pwa-install-dismissed";

export type PwaEngagement = {
  pageViews: string[];
  firstSeenAt: number;
  wishlistSaved: boolean;
  signedIn: boolean;
  hostDashboard: boolean;
};

function read(): PwaEngagement {
  if (typeof window === "undefined") {
    return {
      pageViews: [],
      firstSeenAt: Date.now(),
      wishlistSaved: false,
      signedIn: false,
      hostDashboard: false,
    };
  }
  try {
    const raw = localStorage.getItem(ENGAGE_KEY);
    if (!raw) {
      const fresh: PwaEngagement = {
        pageViews: [],
        firstSeenAt: Date.now(),
        wishlistSaved: false,
        signedIn: false,
        hostDashboard: false,
      };
      localStorage.setItem(ENGAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as PwaEngagement;
  } catch {
    return {
      pageViews: [],
      firstSeenAt: Date.now(),
      wishlistSaved: false,
      signedIn: false,
      hostDashboard: false,
    };
  }
}

function write(data: PwaEngagement) {
  try {
    localStorage.setItem(ENGAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function trackPwaPageView(path: string) {
  const data = read();
  if (!data.pageViews.includes(path)) {
    data.pageViews = [...data.pageViews, path].slice(-20);
  }
  if (path.includes("/host/dashboard")) data.hostDashboard = true;
  write(data);
}

export function markPwaWishlistSaved() {
  const data = read();
  data.wishlistSaved = true;
  write(data);
}

export function markPwaSignedIn() {
  const data = read();
  data.signedIn = true;
  write(data);
}

export function markPwaHostDashboard() {
  const data = read();
  data.hostDashboard = true;
  write(data);
}

/** Visited ≥2 pages AND spent >45s OR wishlist OR signed in OR host dashboard. */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  const data = read();
  const elapsedSec = (Date.now() - (data.firstSeenAt || Date.now())) / 1000;
  const deepBrowse = data.pageViews.length >= 2 && elapsedSec > 45;
  return (
    deepBrowse ||
    data.wishlistSaved ||
    data.signedIn ||
    data.hostDashboard
  );
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
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const chrome = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && !chrome;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}
