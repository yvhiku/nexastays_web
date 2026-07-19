import { DESTINATION_CATALOG } from "./catalog";
import type { DestinationEntry, DestinationKind } from "./types";

export type {
  DestinationCategory,
  DestinationEntry,
  DestinationKind,
} from "./types";
export { DESTINATION_CATALOG } from "./catalog";

export function listingCitiesFromCatalog(): string[] {
  return DESTINATION_CATALOG.filter((d) => d.kind === "city")
    .map((d) => d.label)
    .sort((a, b) => a.localeCompare(b, "en"));
}

export function findCatalogEntryById(id: string | null | undefined): DestinationEntry | undefined {
  if (!id) return undefined;
  return DESTINATION_CATALOG.find((d) => d.id === id);
}

export function findCatalogEntryByLabel(label: string): DestinationEntry | undefined {
  const q = label.trim().toLowerCase();
  if (!q) return undefined;
  return (
    DESTINATION_CATALOG.find((d) => d.label.toLowerCase() === q) ??
    DESTINATION_CATALOG.find((d) => d.aliases.some((a) => a.toLowerCase() === q))
  );
}

export function destinationsByKind(kind: DestinationKind): DestinationEntry[] {
  return DESTINATION_CATALOG.filter((d) => d.kind === kind);
}

/** Popular browse list: cities + tourist destinations only, by popularity. */
export function popularCatalogEntries(limit = 10): DestinationEntry[] {
  return DESTINATION_CATALOG.filter((d) => d.kind !== "landmark")
    .slice()
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

function matchesQuery(entry: DestinationEntry, q: string): boolean {
  if (entry.label.toLowerCase().includes(q)) return true;
  if (entry.resolveCity.toLowerCase().includes(q)) return true;
  if (entry.parentCity?.toLowerCase().includes(q)) return true;
  if (entry.aliases.some((a) => a.toLowerCase().includes(q))) return true;
  return false;
}

function matchScore(entry: DestinationEntry, q: string): number {
  const label = entry.label.toLowerCase();
  if (label === q) return 1000 + entry.searchWeight;
  if (entry.aliases.some((a) => a.toLowerCase() === q)) return 900 + entry.searchWeight;
  if (label.startsWith(q)) return 800 + entry.searchWeight;
  if (entry.aliases.some((a) => a.toLowerCase().startsWith(q))) return 700 + entry.searchWeight;
  return entry.searchWeight + entry.popularity;
}

/** Typeahead filter ranked by match quality then searchWeight/popularity. */
export function filterCatalog(query: string): DestinationEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return DESTINATION_CATALOG.slice().sort((a, b) => b.popularity - a.popularity);
  }
  return DESTINATION_CATALOG.filter((d) => matchesQuery(d, q)).sort(
    (a, b) => matchScore(b, q) - matchScore(a, q),
  );
}
