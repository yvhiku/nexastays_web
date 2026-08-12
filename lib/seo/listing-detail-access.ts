import { fetchSeoListingPage } from "@/lib/seo/listing-api";
import type { SeoListingPagePayload, SeoLocale } from "@/lib/seo/types";

/** UUID v1–v5 shape used by Nest listing routes (avoids SEO endpoint 500 on garbage IDs). */
const LISTING_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * True when `id` is a well-formed listing UUID.
 * Malformed path segments are treated as confirmed unavailable (→ notFound / HTTP 404),
 * not as server errors — the SEO API currently 500s on non-UUID ids.
 */
export function isListingDetailIdFormatValid(id: string): boolean {
  return LISTING_ID_UUID_RE.test(id.trim());
}

/**
 * Confirmed-unavailable vs publicly resolvable listing detail.
 *
 * - `null` → call `notFound()` (HTTP 404)
 * - payload present → HTTP 200, including LIVE + `indexable: false` / `noindex,follow`
 *
 * Do **not** treat `indexable === false` as unavailable.
 * Outages throw from `fetchSeoListingPage` and must not become 404.
 */
export async function resolveListingDetailPage(
  listingId: string,
  locale: SeoLocale,
): Promise<SeoListingPagePayload | null> {
  if (!isListingDetailIdFormatValid(listingId)) {
    return null;
  }
  return fetchSeoListingPage(listingId, locale);
}

/** Payload present ⇒ publicly accessible detail route (eligibility/indexability separate). */
export function isListingDetailAvailable(
  page: SeoListingPagePayload | null,
): page is SeoListingPagePayload {
  return page != null;
}
