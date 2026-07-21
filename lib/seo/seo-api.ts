import { getStaysApiBaseUrl } from "@/lib/env";
import { exploreCardToListing } from "@/lib/stays-api";
import type { ExploreListEnvelope } from "@/lib/stays-types";
import type { StaysListing } from "@/lib/stays-types";
import type { SeoDestinationDto, SeoLocale, SeoPagePayload, SitemapEntryDto } from "./types";

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

export async function fetchSeoCityPage(
  slug: string,
  locale: SeoLocale,
): Promise<SeoPagePayload | null> {
  return seoFetch<SeoPagePayload>(
    `/stays/seo/pages/city/${encodeURIComponent(slug)}?locale=${locale}`,
  );
}

export async function fetchSeoSitemapEntries(): Promise<SitemapEntryDto[]> {
  return (await seoFetch<SitemapEntryDto[]>("/stays/seo/registry/sitemap", 3600)) ?? [];
}

export async function fetchCityListings(searchCity: string): Promise<StaysListing[]> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  const q = new URLSearchParams({ city: searchCity, limit: "12" });
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
