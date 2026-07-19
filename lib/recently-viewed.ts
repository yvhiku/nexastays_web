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
  const list = [next, ...prev].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("nexa-recently-viewed-changed"));
  } catch {
    /* quota */
  }
}
