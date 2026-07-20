const STORAGE_KEY_PREFIX = "nexa-saved-listings:";
const ONBOARDING_KEY = "nexa-saved-onboarding-seen";
const COLLECTION_MILESTONE_KEY = "nexa-saved-collection-milestone";

export type SavedListingSnapshot = {
  id: string;
  title: string;
  city?: string;
  imageUrl?: string;
};

export type SavedListingEventDetail = {
  action: "saved" | "unsaved";
  listingId: string;
  snapshot?: SavedListingSnapshot;
  count: number;
  isFirstSaveEver: boolean;
  /** Skip toast/onboarding (e.g. undo re-save). */
  silent?: boolean;
};

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function getSavedListingIds(userId: string | null | undefined): string[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function isListingSaved(
  listingId: string,
  userId: string | null | undefined,
): boolean {
  return getSavedListingIds(userId).includes(listingId);
}

export function isSavedOnboardingSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

export function markSavedOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isCollectionMilestoneSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(COLLECTION_MILESTONE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markCollectionMilestoneSeen() {
  try {
    localStorage.setItem(COLLECTION_MILESTONE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function emitSavedEvent(detail: SavedListingEventDetail) {
  window.dispatchEvent(
    new CustomEvent<SavedListingEventDetail>("nexa-saved-listings-changed", {
      detail,
    }),
  );
}

export function toggleSavedListing(
  listingId: string,
  userId: string | null | undefined,
  snapshot?: SavedListingSnapshot,
): boolean {
  if (!userId || typeof window === "undefined") return false;
  const ids = getSavedListingIds(userId);
  const exists = ids.includes(listingId);
  const next = exists ? ids.filter((id) => id !== listingId) : [...ids, listingId];
  const isFirstSaveEver = !exists && !isSavedOnboardingSeen();
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
    emitSavedEvent({
      action: exists ? "unsaved" : "saved",
      listingId,
      snapshot: snapshot ?? { id: listingId, title: "Stay" },
      count: next.length,
      isFirstSaveEver: !exists && isFirstSaveEver,
    });
    if (!exists) {
      void import("@/lib/pwa-engagement").then((m) => m.markPwaWishlistSaved());
    }
  } catch {
    return exists;
  }
  return !exists;
}

/** Re-save after undo without first-save onboarding. */
export function saveListingId(
  listingId: string,
  userId: string | null | undefined,
  snapshot?: SavedListingSnapshot,
): void {
  if (!userId || typeof window === "undefined") return;
  const ids = getSavedListingIds(userId);
  if (ids.includes(listingId)) return;
  const next = [...ids, listingId];
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
    emitSavedEvent({
      action: "saved",
      listingId,
      snapshot: snapshot ?? { id: listingId, title: "Stay" },
      count: next.length,
      isFirstSaveEver: false,
      silent: true,
    });
  } catch {
    /* ignore */
  }
}
