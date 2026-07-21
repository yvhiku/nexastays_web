import { getStaysApiBaseUrl } from "@/lib/env";
import { exploreCardToListing } from "@/lib/stays-api";
import type { ExploreListEnvelope } from "@/lib/stays-types";
import type { StaysListing } from "@/lib/stays-types";
import type {
  SeoDestinationDto,
  SeoExploreFiltersDto,
  SeoLocale,
  SeoPagePayload,
  SitemapEntryDto,
} from "./types";

const REVALIDATE = 86400;

async function seoFetch<T>(path: string, revalidate = REVALIDATE): Promise<T | null> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchSeoDestinations(): Promise<SeoDestinationDto[]> {
  return (await seoFetch<SeoDestinationDto[]>("/stays/seo/destinations")) ?? [];
}

export async function fetchSeoPage(
  segments: string[],
  locale: SeoLocale,
): Promise<SeoPagePayload | null> {
  if (segments.length === 0) return null;
  const path = segments.map(encodeURIComponent).join("/");
  if (segments.length === 1) {
    return seoFetch<SeoPagePayload>(
      `/stays/seo/pages/${encodeURIComponent(segments[0]!)}?locale=${locale}`,
    );
  }
  return seoFetch<SeoPagePayload>(
    `/stays/seo/pages/${encodeURIComponent(segments[0]!)}/${encodeURIComponent(segments[1]!)}?locale=${locale}`,
  );
}

/** @deprecated use fetchSeoPage */
export async function fetchSeoCityPage(
  slug: string,
  locale: SeoLocale,
): Promise<SeoPagePayload | null> {
  return fetchSeoPage([slug], locale);
}

export async function fetchSeoSitemapEntries(): Promise<SitemapEntryDto[]> {
  return (await seoFetch<SitemapEntryDto[]>("/stays/seo/registry/sitemap", 3600)) ?? [];
}

function exploreFiltersToParams(filters: SeoExploreFiltersDto): URLSearchParams {
  const q = new URLSearchParams({ limit: "12" });
  if (filters.city) q.set("city", filters.city);
  if (filters.listing_type) q.set("listing_type", filters.listing_type);
  if (filters.amenity) q.set("amenity", filters.amenity);
  if (filters.pets_allowed) q.set("pets_allowed", "true");
  if (filters.luxury_only) q.set("luxury_only", "true");
  if (filters.family_friendly) q.set("family_friendly", "true");
  return q;
}

export async function fetchSeoListings(
  filters: SeoExploreFiltersDto,
): Promise<StaysListing[]> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  const q = exploreFiltersToParams(filters);
  try {
    const res = await fetch(`${base}/stays/explore?${q.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as ExploreListEnvelope;
    return (data.items ?? []).map(exploreCardToListing);
  } catch {
    return [];
  }
}

/** @deprecated use fetchSeoListings */
export async function fetchCityListings(searchCity: string): Promise<StaysListing[]> {
  return fetchSeoListings({ city: searchCity });
}

export function buildListingsQueryPath(filters: SeoExploreFiltersDto): string {
  const q = exploreFiltersToParams(filters);
  q.delete("limit");
  const qs = q.toString();
  return qs ? `/listings?${qs}` : "/listings";
}
