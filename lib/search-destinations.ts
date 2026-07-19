import {
  DESTINATION_CATALOG,
  filterCatalog,
  findCatalogEntryById,
  popularCatalogEntries,
  type DestinationEntry,
} from "@/lib/destinations";

export type SearchDestination = {
  id: string;
  label: string;
  /** i18n key under searchBar.destSubtitles.* or plain fallback */
  subtitleKey: string;
  /** Listings API city filter */
  resolveCity: string;
  popular?: boolean;
};

function toSearchDestination(entry: DestinationEntry, popularIds: Set<string>): SearchDestination {
  return {
    id: entry.id,
    label: entry.label,
    subtitleKey: entry.subtitleKey ?? entry.categories[0] ?? "city",
    resolveCity: entry.resolveCity,
    popular: popularIds.has(entry.id),
  };
}

const POPULAR_ENTRIES = popularCatalogEntries(12);
const POPULAR_IDS = new Set(POPULAR_ENTRIES.map((e) => e.id));

export const SEARCH_DESTINATIONS: SearchDestination[] = DESTINATION_CATALOG.map((e) =>
  toSearchDestination(e, POPULAR_IDS),
);

export const POPULAR_DESTINATIONS: SearchDestination[] = POPULAR_ENTRIES.map((e) =>
  toSearchDestination(e, POPULAR_IDS),
);

export function findDestinationById(id: string | null | undefined): SearchDestination | undefined {
  const entry = findCatalogEntryById(id);
  return entry ? toSearchDestination(entry, POPULAR_IDS) : undefined;
}

export function findDestinationByCity(city: string): SearchDestination | undefined {
  const c = city.trim();
  if (!c) return undefined;
  const lower = c.toLowerCase();
  const entry =
    DESTINATION_CATALOG.find(
      (d) => d.kind === "city" && d.resolveCity.toLowerCase() === lower,
    ) ??
    DESTINATION_CATALOG.find((d) => d.label.toLowerCase() === lower) ??
    DESTINATION_CATALOG.find((d) => d.aliases.some((a) => a.toLowerCase() === lower));
  return entry ? toSearchDestination(entry, POPULAR_IDS) : undefined;
}

export function filterDestinations(query: string): SearchDestination[] {
  return filterCatalog(query).map((e) => toSearchDestination(e, POPULAR_IDS));
}
