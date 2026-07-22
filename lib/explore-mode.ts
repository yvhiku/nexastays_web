import type { ExploreFilters } from "@/lib/search/explore-filter-utils";

export type ExplorePageMode = "feed" | "searchResults";

/** Derive browse vs intent mode from URL-backed filters. */
export function getExploreMode(filters: ExploreFilters): ExplorePageMode {
  const listingType = filters.listing_type?.toUpperCase() ?? "ALL";
  const hasIntent =
    Boolean(filters.city?.trim()) ||
    Boolean(filters.checkin_date) ||
    Boolean(filters.checkout_date) ||
    (filters.guests != null && filters.guests > 1) ||
    (listingType !== "ALL" && listingType !== "") ||
    Boolean(filters.verified_walkthrough_only) ||
    Boolean(filters.instant_booking_only) ||
    Boolean(filters.neighborhood?.trim()) ||
    Boolean(filters.amenity) ||
    Boolean(filters.pets_allowed) ||
    Boolean(filters.luxury_only) ||
    Boolean(filters.family_friendly) ||
    filters.near_lat != null;

  return hasIntent ? "searchResults" : "feed";
}
