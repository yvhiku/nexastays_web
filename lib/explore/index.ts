import { casablanca } from "./cities/casablanca";
import { marrakech } from "./cities/marrakech";
import { tangier } from "./cities/tangier";
import { agadir } from "./cities/agadir";
import { rabat } from "./cities/rabat";
import { fes } from "./cities/fes";
import { essaouira } from "./cities/essaouira";
import { chefchaouen } from "./cities/chefchaouen";
import { tetouan } from "./cities/tetouan";
import { ifrane } from "./cities/ifrane";
import { descriptorI18nKey } from "./descriptors";
import { normalizePlaceQuery, queriesMatch, toPlaceSlug } from "./normalize";
import type {
  ExploreCityContext,
  ExploreCityModule,
  ExploreNeighborhood,
  ExploreNeighborhoodView,
} from "./types";

export { CATALOG_VERSION } from "./version";
export * from "./types";
export * from "./descriptors";
export * from "./normalize";

export const EXPLORE_CITIES: ExploreCityModule[] = [
  casablanca,
  marrakech,
  tangier,
  agadir,
  rabat,
  fes,
  essaouira,
  chefchaouen,
  tetouan,
  ifrane,
].sort((a, b) => a.priority - b.priority);

/** Discover Morocco city chips — all Tier-1 catalog cities, highest searchWeight first. */
export const MOROCCO_CONTEXT = {
  titleKey: "explore.moroccoTitle",
  subtitleKey: "explore.moroccoSubtitle",
  popularCities: [...EXPLORE_CITIES]
    .sort((a, b) => b.searchWeight - a.searchWeight || a.priority - b.priority)
    .map((c) => c.city),
} as const;

function cityMatchTokens(city: ExploreCityModule): string[] {
  return [city.id, city.slug, city.city, ...city.aliases].map(normalizePlaceQuery);
}

export function findCity(query: string): ExploreCityModule | null {
  const q = normalizePlaceQuery(query);
  if (!q) return null;
  return (
    EXPLORE_CITIES.find((c) => cityMatchTokens(c).includes(q)) ??
    EXPLORE_CITIES.find((c) =>
      cityMatchTokens(c).some((t) => t === q || t.includes(q) || q.includes(t)),
    ) ??
    null
  );
}

function neighborhoodMatchTokens(n: ExploreNeighborhood): string[] {
  return [n.id, n.slug, n.name, ...n.aliases].map(normalizePlaceQuery);
}

export function findNeighborhood(args: {
  city: string;
  name: string;
}): ExploreNeighborhood | null {
  const city = findCity(args.city);
  if (!city || !args.name.trim()) return null;
  const q = normalizePlaceQuery(args.name);
  return (
    city.neighborhoods.find((n) => neighborhoodMatchTokens(n).includes(q)) ??
    city.neighborhoods.find((n) =>
      neighborhoodMatchTokens(n).some((t) => queriesMatch(t, q)),
    ) ??
    null
  );
}

export function sortNeighborhoodsForDisplay(
  neighborhoods: ExploreNeighborhood[],
): ExploreNeighborhood[] {
  return [...neighborhoods].sort((a, b) => {
    const af = a.featuredOrder ?? Number.POSITIVE_INFINITY;
    const bf = b.featuredOrder ?? Number.POSITIVE_INFINITY;
    if (af !== bf) return af - bf;
    return (b.searchWeight ?? 0) - (a.searchWeight ?? 0);
  });
}

export function toCityContext(city: ExploreCityModule): ExploreCityContext {
  return {
    slug: city.slug,
    city: city.city,
    titleKey: `explore.cities.${city.slug}.title`,
    subtitleKey: `explore.cities.${city.slug}.subtitle`,
    taglineKey: `explore.cityTags.${city.tag}`,
    tag: city.tag,
    mapCenter: city.mapCenter,
    bounds: city.bounds,
    defaultZoom: city.defaultZoom,
    neighborhoods: sortNeighborhoodsForDisplay(city.neighborhoods).map(
      (n): ExploreNeighborhoodView => ({
        name: n.name,
        descriptorKey: descriptorI18nKey(n.descriptor),
      }),
    ),
  };
}

/** Legacy array shape for older call sites. */
export const EXPLORE_CITY_CONTEXTS: ExploreCityContext[] =
  EXPLORE_CITIES.map(toCityContext);

export function getCityContextByCity(city: string): ExploreCityContext | null {
  const found = findCity(city);
  return found ? toCityContext(found) : null;
}

export function slugifyNeighborhood(name: string): string {
  return toPlaceSlug(name);
}

/** @deprecated Prefer findNeighborhood({ city, name }) */
export function matchCuratedNeighborhood(
  city: string,
  candidate: string,
): ExploreNeighborhoodView | null {
  const n = findNeighborhood({ city, name: candidate });
  if (!n) return null;
  return {
    name: n.name,
    descriptorKey: descriptorI18nKey(n.descriptor),
  };
}

export function viewportAvgPrice(
  listings: {
    rate_plan?: {
      base_price?: number | null;
      currency?: string | null;
    } | null;
  }[],
): { avg: number; currency: string } | null {
  const priced = listings
    .map((l) => Number(l.rate_plan?.base_price))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (priced.length === 0) return null;
  const avg = Math.round(priced.reduce((a, b) => a + b, 0) / priced.length);
  const currency =
    listings
      .find((l) => l.rate_plan?.currency)
      ?.rate_plan?.currency?.toUpperCase() || "MAD";
  return { avg, currency };
}

export function pointInBounds(
  lat: number,
  lng: number,
  bounds: ExploreCityModule["bounds"],
): boolean {
  return (
    lat >= bounds.southwest.lat &&
    lat <= bounds.northeast.lat &&
    lng >= bounds.southwest.lng &&
    lng <= bounds.northeast.lng
  );
}
