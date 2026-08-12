import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import type { SeoLocale } from "@/lib/seo/types";

/**
 * Recognized Explore UI/API state query keys (source-derived).
 * Presence of any key — including empty values like `?city=` — marks the URL
 * as explore state for SEO (noindex,follow + clean base canonical).
 *
 * Intentional policy: unknown keys (e.g. `?foo=bar`) and tracking-only params
 * do NOT trigger noindex. Do not use `searchParams.size > 0`.
 */
export const EXPLORE_STATE_PARAM_KEYS = [
  "version",
  "city",
  "neighborhood",
  "listing_type",
  "amenity",
  "pets_allowed",
  "luxury_only",
  "family_friendly",
  "near_lat",
  "near_lng",
  "near_radius_km",
  "verified_walkthrough_only",
  "instant_booking_only",
  "checkin_date",
  "checkout_date",
  "guests",
  "sort",
  "min_price",
  "max_price",
  "bedrooms",
  "bathrooms",
  "min_rating",
  "verified_host",
  "superhost",
  "language",
  "destination",
  "adults",
  "children",
  "infants",
  "pets",
  "vibe",
  "collection",
  "layout",
  "cursor",
] as const;

const EXPLORE_STATE_KEY_SET = new Set<string>(EXPLORE_STATE_PARAM_KEYS);

const LISTINGS_COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Explore Verified Stays in Morocco | Nexa Stays",
    description: "Search verified apartments, villas, riads, hotels, and hostels across Morocco.",
  },
  fr: {
    title: "Découvrez des séjours vérifiés au Maroc | Nexa Stays",
    description: "Recherchez des appartements, villas, riads, hôtels et auberges vérifiés au Maroc.",
  },
  ar: {
    title: "اكتشف إقامات موثقة في المغرب | Nexa Stays",
    description: "ابحث عن شقق وفيلات ورياض وفنادق ونُزل موثقة في مختلف أنحاء المغرب.",
  },
};

export function isTrackingParam(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.startsWith("utm_") ||
    lower === "gclid" ||
    lower === "fbclid" ||
    lower === "msclkid"
  );
}

/** Next searchParams shapes — classification uses keys only, never values. */
export type ExploreSearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

/**
 * Collect query keys only (presence-based). Values are ignored so
 * `?city=` and `?city=casablanca` classify identically.
 */
export function exploreSearchParamKeys(
  input: ExploreSearchParamsInput | null | undefined,
): Set<string> {
  const keys = new Set<string>();
  if (input == null) return keys;

  if (input instanceof URLSearchParams) {
    for (const key of input.keys()) keys.add(key);
    return keys;
  }

  for (const key of Object.keys(input)) {
    keys.add(key);
  }
  return keys;
}

/**
 * True when any recognized Explore state key is present.
 * Tracking and unknown keys alone return false.
 */
export function hasExploreStateParams(
  input: ExploreSearchParamsInput | null | undefined,
): boolean {
  for (const key of exploreSearchParamKeys(input)) {
    if (EXPLORE_STATE_KEY_SET.has(key)) return true;
  }
  return false;
}

export function buildExploreListingsMetadata(
  rawLocale: string,
  searchParams?: ExploreSearchParamsInput | null,
): Metadata {
  const locale = getServerLocale(rawLocale);
  const copy = LISTINGS_COPY[locale];
  const exploreState = hasExploreStateParams(searchParams);
  return buildSeoMetadata({
    ...copy,
    path: `/${locale}/listings`,
    locale: locale as SeoLocale,
    robots: exploreState ? "noindex,follow" : undefined,
  });
}
