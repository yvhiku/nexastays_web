import type { StaysListing } from "./stays-types";

const FLOOR_FRAGMENT_RE =
  /^(étage|etage|floor|level|apt|apartment|appartement|studio)\b/i;

function isFloorFragment(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  return FLOOR_FRAGMENT_RE.test(value);
}

function normalizeAddressSeparators(address: string): string {
  return address
    .replace(/\.\s+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseNeighborhood(listing: StaysListing): string {
  const fromApi = listing.neighborhood?.trim();
  if (fromApi && !isFloorFragment(fromApi)) return fromApi;

  const address = listing.address?.trim();
  if (!address) return "";

  const parts = normalizeAddressSeparators(address)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const cityLower = listing.city?.toLowerCase() ?? "";
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].toLowerCase() === cityLower && i > 0) {
      const candidate = parts[i - 1];
      return isFloorFragment(candidate) ? "" : candidate;
    }
  }

  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    return isFloorFragment(candidate) ? "" : candidate;
  }

  return "";
}

/** Full address string for display and open-in-maps search. */
export function getFullMapsSearchQuery(listing: StaysListing): string {
  const rawAddress = listing.address?.trim() ?? "";
  const city = listing.city?.trim() ?? "";
  const neighborhood = parseNeighborhood(listing);

  if (rawAddress) {
    let query = normalizeAddressSeparators(rawAddress);
    const lower = query.toLowerCase();

    if (city && !lower.includes(city.toLowerCase())) {
      query = `${query}, ${city}`;
    }
    if (!query.toLowerCase().includes("morocco")) {
      query = `${query}, Morocco`;
    }
    return query;
  }

  const parts: string[] = [];
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  parts.push("Morocco");
  return parts.join(", ");
}

export function getShortLocationLabel(listing: StaysListing): string {
  const neighborhood = parseNeighborhood(listing);
  const city = listing.city?.trim() ?? "";
  if (neighborhood && city) return `${neighborhood}, ${city}`;
  if (listing.address?.trim()) return getFullMapsSearchQuery(listing);
  if (city) return `${city}, Morocco`;
  return "Morocco";
}

export function getListingLocationText(listing: StaysListing): string {
  return getFullMapsSearchQuery(listing);
}

export function hasListingLocationInfo(listing: StaysListing): boolean {
  return Boolean(
    listing.address?.trim() ||
      listing.city?.trim() ||
      hasMapCoordinates(listing),
  );
}

export function hasMapCoordinates(listing: {
  geo_lat?: number | null;
  geo_lng?: number | null;
}): boolean {
  const lat = listing.geo_lat;
  const lng = listing.geo_lng;
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Number(lat) >= -90 &&
    Number(lat) <= 90 &&
    Number(lng) >= -180 &&
    Number(lng) <= 180
  );
}

/** Opens the place in Google Maps (embedded map stays OSM). */
export function getMapsSearchUrl(listing: StaysListing): string | null {
  if (hasMapCoordinates(listing)) {
    const lat = Number(listing.geo_lat);
    const lng = Number(listing.geo_lng);
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const query = getFullMapsSearchQuery(listing);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
