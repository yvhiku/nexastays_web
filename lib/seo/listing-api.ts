import { getStaysApiBaseUrl } from "@/lib/env";
import type { SeoListingPagePayload, SeoLocale } from "./types";

const REVALIDATE = 3600;

/** Propagated for Stays SEO outages — must not be converted into a soft/hard 404. */
export class SeoListingFetchError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SeoListingFetchError";
    this.status = status;
  }
}

/**
 * Fetch SEO listing payload.
 *
 * Contract:
 * - HTTP 404 / 400 → `null` (confirmed unavailable / malformed at API)
 * - HTTP 2xx → payload (`indexable: false` is still a valid payload)
 * - HTTP 5xx / other unexpected status → throws `SeoListingFetchError`
 * - Network failure → rethrows (do not disguise as missing listing)
 */
export async function fetchSeoListingPage(
  listingId: string,
  locale: SeoLocale,
): Promise<SeoListingPagePayload | null> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(
      `${base}/stays/seo/listings/${encodeURIComponent(listingId)}?locale=${locale}`,
      { next: { revalidate: REVALIDATE } },
    );
  } catch (err) {
    throw err;
  }

  if (res.status === 404 || res.status === 400) {
    return null;
  }

  if (!res.ok) {
    throw new SeoListingFetchError(
      res.status,
      `SEO listing fetch failed with status ${res.status}`,
    );
  }

  return (await res.json()) as SeoListingPagePayload;
}
