import { getStaysApiBaseUrl } from "@/lib/env";
import type { SeoListingPagePayload, SeoLocale } from "./types";

const REVALIDATE = 3600;

export async function fetchSeoListingPage(
  listingId: string,
  locale: SeoLocale,
): Promise<SeoListingPagePayload | null> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  try {
    const res = await fetch(
      `${base}/stays/seo/listings/${encodeURIComponent(listingId)}?locale=${locale}`,
      { next: { revalidate: REVALIDATE } },
    );
    if (!res.ok) return null;
    return (await res.json()) as SeoListingPagePayload;
  } catch {
    return null;
  }
}
