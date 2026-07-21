import {
  sanitizeCityInput,
  sanitizeDateInput,
  sanitizeGuestCount,
} from "@/lib/input-sanitize";
import type { SearchListingsParams } from "@/lib/stays-types";

export const EXPLORE_FILTER_VERSION = 1 as const;

const LISTING_TYPES = new Set(["APARTMENT", "HOTEL", "RIAD", "VILLA", "HOSTEL"]);
const SORT_OPTIONS = new Set(["newest", "rating", "price_asc", "price_desc"]);

/** Platform contract — canonical explore filter object. */
export interface ExploreFilters {
  version?: typeof EXPLORE_FILTER_VERSION;
  city?: string;
  neighborhood?: string;
  listing_type?: string;
  amenity?: string;
  pets_allowed?: boolean;
  luxury_only?: boolean;
  family_friendly?: boolean;
  near_lat?: number;
  near_lng?: number;
  near_radius_km?: number;
  verified_walkthrough_only?: boolean;
  instant_booking_only?: boolean;
  checkin_date?: string;
  checkout_date?: string;
  guests?: number;
  sort?: string;
  /** Reserved — serialize/deserialize; API forward when backend DTO adds support. */
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  min_rating?: number;
  verified_host?: boolean;
  superhost?: boolean;
  language?: string;
}

function parseBoolean(value: string | null | undefined): boolean | undefined {
  if (value == null || value === "") return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

function parseLat(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value < -90 || value > 90) return undefined;
  return value;
}

function parseLng(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value < -180 || value > 180) return undefined;
  return value;
}

function parseRadiusKm(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value < 0.1 || value > 50) return undefined;
  return value;
}

function normalizeListingType(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const upper = value.trim().toUpperCase();
  return LISTING_TYPES.has(upper) ? upper : undefined;
}

function normalizeSort(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const lower = value.trim().toLowerCase();
  return SORT_OPTIONS.has(lower) ? lower : undefined;
}

function normalizeNeighborhood(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeAmenity(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed || !/^[a-z0-9_]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeLanguage(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): ExploreFilters {
  const out: ExploreFilters = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      (out as Record<string, unknown>)[key] = val;
    }
  }
  return out;
}

/** Canonicalize every entry point before serialize or API forward. */
export function normalizeExploreFilters(input: ExploreFilters): ExploreFilters {
  const city = sanitizeCityInput(input.city ?? "");
  const checkin = input.checkin_date ? sanitizeDateInput(input.checkin_date) : "";
  const checkout = input.checkout_date ? sanitizeDateInput(input.checkout_date) : "";
  const guestsRaw = input.guests != null ? sanitizeGuestCount(input.guests) : undefined;
  const guests = guestsRaw != null && guestsRaw > 0 ? guestsRaw : undefined;

  const nearLat = parseLat(input.near_lat);
  const nearLng = parseLng(input.near_lng);
  let nearRadius = parseRadiusKm(input.near_radius_km);
  if (nearLat == null || nearLng == null) {
    nearRadius = undefined;
  }

  const sort = normalizeSort(input.sort);
  const listingType = normalizeListingType(input.listing_type);

  return stripUndefined({
    version: EXPLORE_FILTER_VERSION,
    city: city || undefined,
    neighborhood: normalizeNeighborhood(input.neighborhood),
    listing_type: listingType,
    amenity: normalizeAmenity(input.amenity),
    pets_allowed: input.pets_allowed === true ? true : undefined,
    luxury_only: input.luxury_only === true ? true : undefined,
    family_friendly: input.family_friendly === true ? true : undefined,
    near_lat: nearLat,
    near_lng: nearLng,
    near_radius_km: nearRadius,
    verified_walkthrough_only:
      input.verified_walkthrough_only === true ? true : undefined,
    instant_booking_only: input.instant_booking_only === true ? true : undefined,
    checkin_date: checkin || undefined,
    checkout_date: checkout || undefined,
    guests,
    sort: sort && sort !== "newest" ? sort : undefined,
    min_price:
      input.min_price != null && Number.isFinite(input.min_price) && input.min_price >= 0
        ? input.min_price
        : undefined,
    max_price:
      input.max_price != null && Number.isFinite(input.max_price) && input.max_price >= 0
        ? input.max_price
        : undefined,
    bedrooms:
      input.bedrooms != null && Number.isFinite(input.bedrooms) && input.bedrooms > 0
        ? Math.floor(input.bedrooms)
        : undefined,
    bathrooms:
      input.bathrooms != null && Number.isFinite(input.bathrooms) && input.bathrooms > 0
        ? Math.floor(input.bathrooms)
        : undefined,
    min_rating:
      input.min_rating != null && Number.isFinite(input.min_rating) && input.min_rating >= 0
        ? input.min_rating
        : undefined,
    verified_host: input.verified_host === true ? true : undefined,
    superhost: input.superhost === true ? true : undefined,
    language: normalizeLanguage(input.language),
  });
}

export function exploreFiltersToSearchParams(filters: ExploreFilters): URLSearchParams {
  const normalized = normalizeExploreFilters(filters);
  const q = new URLSearchParams();
  q.set("version", String(EXPLORE_FILTER_VERSION));

  if (normalized.city) q.set("city", normalized.city);
  if (normalized.neighborhood) q.set("neighborhood", normalized.neighborhood);
  if (normalized.listing_type) q.set("listing_type", normalized.listing_type);
  if (normalized.amenity) q.set("amenity", normalized.amenity);
  if (normalized.pets_allowed) q.set("pets_allowed", "true");
  if (normalized.luxury_only) q.set("luxury_only", "true");
  if (normalized.family_friendly) q.set("family_friendly", "true");
  if (normalized.near_lat != null) q.set("near_lat", String(normalized.near_lat));
  if (normalized.near_lng != null) q.set("near_lng", String(normalized.near_lng));
  if (normalized.near_radius_km != null) {
    q.set("near_radius_km", String(normalized.near_radius_km));
  }
  if (normalized.verified_walkthrough_only) q.set("verified_walkthrough_only", "true");
  if (normalized.instant_booking_only) q.set("instant_booking_only", "true");
  if (normalized.checkin_date) q.set("checkin_date", normalized.checkin_date);
  if (normalized.checkout_date) q.set("checkout_date", normalized.checkout_date);
  if (normalized.guests != null) q.set("guests", String(normalized.guests));
  if (normalized.sort) q.set("sort", normalized.sort);

  if (normalized.min_price != null) q.set("min_price", String(normalized.min_price));
  if (normalized.max_price != null) q.set("max_price", String(normalized.max_price));
  if (normalized.bedrooms != null) q.set("bedrooms", String(normalized.bedrooms));
  if (normalized.bathrooms != null) q.set("bathrooms", String(normalized.bathrooms));
  if (normalized.min_rating != null) q.set("min_rating", String(normalized.min_rating));
  if (normalized.verified_host) q.set("verified_host", "true");
  if (normalized.superhost) q.set("superhost", "true");
  if (normalized.language) q.set("language", normalized.language);

  return q;
}

type SearchParamsLike = URLSearchParams | { get: (key: string) => string | null };

export function searchParamsToExploreFilters(sp: SearchParamsLike): ExploreFilters {
  const raw: ExploreFilters = {
    version: EXPLORE_FILTER_VERSION,
    city: sp.get("city") ?? undefined,
    neighborhood: sp.get("neighborhood") ?? undefined,
    listing_type: sp.get("listing_type") ?? undefined,
    amenity: sp.get("amenity") ?? undefined,
    pets_allowed: parseBoolean(sp.get("pets_allowed")),
    luxury_only: parseBoolean(sp.get("luxury_only")),
    family_friendly: parseBoolean(sp.get("family_friendly")),
    near_lat: sp.get("near_lat") != null ? Number(sp.get("near_lat")) : undefined,
    near_lng: sp.get("near_lng") != null ? Number(sp.get("near_lng")) : undefined,
    near_radius_km:
      sp.get("near_radius_km") != null ? Number(sp.get("near_radius_km")) : undefined,
    verified_walkthrough_only: parseBoolean(sp.get("verified_walkthrough_only")),
    instant_booking_only: parseBoolean(sp.get("instant_booking_only")),
    checkin_date: sp.get("checkin_date") ?? undefined,
    checkout_date: sp.get("checkout_date") ?? undefined,
    guests: sp.get("guests") != null ? Number(sp.get("guests")) : undefined,
    sort: sp.get("sort") ?? undefined,
    min_price: sp.get("min_price") != null ? Number(sp.get("min_price")) : undefined,
    max_price: sp.get("max_price") != null ? Number(sp.get("max_price")) : undefined,
    bedrooms: sp.get("bedrooms") != null ? Number(sp.get("bedrooms")) : undefined,
    bathrooms: sp.get("bathrooms") != null ? Number(sp.get("bathrooms")) : undefined,
    min_rating: sp.get("min_rating") != null ? Number(sp.get("min_rating")) : undefined,
    verified_host: parseBoolean(sp.get("verified_host")),
    superhost: parseBoolean(sp.get("superhost")),
    language: sp.get("language") ?? undefined,
  };
  return normalizeExploreFilters(raw);
}

export function buildListingsPath(filters: ExploreFilters): string {
  const q = exploreFiltersToSearchParams(filters);
  q.delete("version");
  const qs = q.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

/** Map canonical filters → Explore API params (only backend-supported fields). */
export function exploreFiltersToApiParams(filters: ExploreFilters): SearchListingsParams {
  const n = normalizeExploreFilters(filters);
  const params: SearchListingsParams = {};

  if (n.city) params.city = n.city;
  if (n.neighborhood) params.neighborhood = n.neighborhood;
  if (n.listing_type) {
    params.listing_type = n.listing_type as SearchListingsParams["listing_type"];
  }
  if (n.amenity) params.amenity = n.amenity;
  if (n.pets_allowed) params.pets_allowed = true;
  if (n.luxury_only) params.luxury_only = true;
  if (n.family_friendly) params.family_friendly = true;
  if (n.near_lat != null) params.near_lat = n.near_lat;
  if (n.near_lng != null) params.near_lng = n.near_lng;
  if (n.near_radius_km != null) params.near_radius_km = n.near_radius_km;
  if (n.verified_walkthrough_only) params.verified_walkthrough_only = true;
  if (n.instant_booking_only) params.instant_booking_only = true;
  if (n.checkin_date) params.checkin_date = n.checkin_date;
  if (n.checkout_date) params.checkout_date = n.checkout_date;
  if (n.guests != null) params.guests = n.guests;
  if (n.sort) {
    params.sort = n.sort as SearchListingsParams["sort"];
  }

  return params;
}

/** Merge partial overrides into existing filters (round-trip safe). */
export function mergeExploreFilters(
  base: ExploreFilters,
  overrides: Partial<ExploreFilters>,
): ExploreFilters {
  return normalizeExploreFilters({ ...base, ...overrides });
}
