const STORAGE_KEY_PREFIX = "nexa-saved-listings:";

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

export function toggleSavedListing(
  listingId: string,
  userId: string | null | undefined,
): boolean {
  if (!userId || typeof window === "undefined") return false;
  const ids = getSavedListingIds(userId);
  const exists = ids.includes(listingId);
  const next = exists ? ids.filter((id) => id !== listingId) : [...ids, listingId];
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("nexa-saved-listings-changed"));
  } catch {
    return exists;
  }
  return !exists;
}
