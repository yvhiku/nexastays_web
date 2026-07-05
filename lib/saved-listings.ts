const STORAGE_KEY = "nexa-saved-listings";

export function getSavedListingIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isListingSaved(listingId: string): boolean {
  return getSavedListingIds().includes(listingId);
}

export function toggleSavedListing(listingId: string): boolean {
  const ids = getSavedListingIds();
  const exists = ids.includes(listingId);
  const next = exists ? ids.filter((id) => id !== listingId) : [...ids, listingId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("nexa-saved-listings-changed"));
  return !exists;
}
