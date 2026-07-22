import type { SearchBarValue } from "@/components/search/types";

const STORAGE_KEY = "nexa-explore-recent-searches";
const MAX = 5;

export type ExploreRecentSearch = {
  label: string;
  city?: string;
  checkin?: string;
  checkout?: string;
  guests?: number;
  searchedAt: number;
};

export function getExploreRecentSearches(): ExploreRecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ExploreRecentSearch =>
        !!x &&
        typeof x === "object" &&
        typeof (x as ExploreRecentSearch).label === "string",
    );
  } catch {
    return [];
  }
}

export function recordExploreRecentSearch(value: SearchBarValue, label: string): void {
  if (typeof window === "undefined") return;
  const entry: ExploreRecentSearch = {
    label,
    city: value.city || undefined,
    checkin: value.checkin || undefined,
    checkout: value.checkout || undefined,
    guests: value.adults + value.children || undefined,
    searchedAt: Date.now(),
  };
  const prev = getExploreRecentSearches().filter(
    (x) => x.label !== entry.label && x.city !== entry.city,
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...prev].slice(0, MAX)));
  } catch {
    /* quota */
  }
}
