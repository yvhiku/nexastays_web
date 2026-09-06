const STORAGE_KEY = "nexa-recently-viewed";
const MAX_ITEMS = 20;

export type RecentlyViewedItem = {
  id: string;
  title: string;
  city?: string;
  imageUrl?: string;
  viewedAt: number;
};

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RecentlyViewedItem =>
        !!x &&
        typeof x === "object" &&
        typeof (x as RecentlyViewedItem).id === "string" &&
        typeof (x as RecentlyViewedItem).title === "string",
    );
  } catch {
    return [];
  }
}

function writeRecentlyViewed(list: RecentlyViewedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("nexa-recently-viewed-changed"));
  } catch {
    /* quota */
  }
}

/** Drop listings that are no longer publicly available (paused, rejected, removed). */
export function removeRecentlyViewed(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  const drop = new Set(ids);
  const prev = getRecentlyViewed();
  const next = prev.filter((x) => !drop.has(x.id));
  if (next.length !== prev.length) writeRecentlyViewed(next);
}

const AVAILABILITY_CACHE_KEY = "nexa-recently-viewed-availability";
/** Re-probe a listing at most this often per browser session. */
const AVAILABILITY_TTL_MS = 10 * 60 * 1000;

type AvailabilityCache = Record<string, number>;

function readAvailabilityCache(): AvailabilityCache {
  try {
    const raw = sessionStorage.getItem(AVAILABILITY_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as AvailabilityCache) : {};
  } catch {
    return {};
  }
}

function writeAvailabilityCache(cache: AvailabilityCache): void {
  try {
    sessionStorage.setItem(AVAILABILITY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota */
  }
}

/**
 * Remove recently-viewed listings that the marketplace no longer serves
 * (e.g. the host or an admin paused them). `probe` returns `false` when the
 * listing is definitively gone, `true` when live, `null` when unknown — only
 * `false` prunes, so a flaky network never wipes the list.
 *
 * Results are cached per session so the rail doesn't re-hit the API on every
 * render; `limit` bounds how many entries are checked (the rail shows a few).
 */
export async function pruneUnavailableRecentlyViewed(
  probe: (id: string) => Promise<boolean | null>,
  limit = 6,
): Promise<string[]> {
  if (typeof window === "undefined") return [];
  const items = getRecentlyViewed().slice(0, limit);
  if (items.length === 0) return [];

  const now = Date.now();
  const cache = readAvailabilityCache();
  const toCheck = items.filter((x) => !(cache[x.id] && now - cache[x.id] < AVAILABILITY_TTL_MS));
  if (toCheck.length === 0) return [];

  const results = await Promise.all(
    toCheck.map(async (x) => [x.id, await probe(x.id)] as const),
  );
  const gone: string[] = [];
  for (const [id, available] of results) {
    if (available === false) gone.push(id);
    else if (available === true) cache[id] = now;
  }
  writeAvailabilityCache(cache);
  if (gone.length > 0) removeRecentlyViewed(gone);
  return gone;
}

export function recordRecentlyViewed(
  item: Omit<RecentlyViewedItem, "viewedAt"> & { viewedAt?: number },
): void {
  if (typeof window === "undefined" || !item.id) return;
  const next: RecentlyViewedItem = {
    id: item.id,
    title: item.title,
    city: item.city,
    imageUrl: item.imageUrl,
    viewedAt: item.viewedAt ?? Date.now(),
  };
  const prev = getRecentlyViewed().filter((x) => x.id !== next.id);
  writeRecentlyViewed([next, ...prev].slice(0, MAX_ITEMS));
}
