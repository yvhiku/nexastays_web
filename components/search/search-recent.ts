const STORAGE_KEY = "nexa-recent-searches";
const MAX = 5;

export type RecentSearchEntry = {
  destinationId: string;
  label: string;
  city: string;
  at: number;
};

function readRaw(): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearchEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.destinationId === "string" && typeof e.label === "string",
    );
  } catch {
    return [];
  }
}

export function getRecentSearches(): RecentSearchEntry[] {
  return readRaw().slice(0, MAX);
}

export function pushRecentSearch(entry: Omit<RecentSearchEntry, "at">): void {
  if (typeof window === "undefined") return;
  const next: RecentSearchEntry[] = [
    { ...entry, at: Date.now() },
    ...readRaw().filter((e) => e.destinationId !== entry.destinationId),
  ].slice(0, MAX);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
