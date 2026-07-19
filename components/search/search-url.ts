import {
  sanitizeCityInput,
  sanitizeDateInput,
  sanitizeGuestCount,
} from "@/lib/input-sanitize";
import { findDestinationByCity, findDestinationById } from "@/lib/search-destinations";
import {
  DEFAULT_SEARCH_BAR_VALUE,
  type SearchBarValue,
} from "@/components/search/types";

export function occupancyTotal(value: Pick<SearchBarValue, "adults" | "children">): number {
  return Math.max(0, value.adults + value.children);
}

export function clampGuestPart(n: number, max = 16): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), max);
}

/** Serialize search bar → URL. Omits zeros / empty / all. */
export function searchBarValueToParams(
  value: SearchBarValue,
  extras?: {
    verified?: boolean;
    instant?: boolean;
    sort?: string;
    vibe?: string | null;
    collection?: string | null;
    neighborhood?: string | null;
  },
): URLSearchParams {
  const params = new URLSearchParams();
  const city = sanitizeCityInput(value.city);
  if (city) params.set("city", city);

  const checkin = sanitizeDateInput(value.checkin);
  const checkout = sanitizeDateInput(value.checkout);
  if (checkin) params.set("checkin_date", checkin);
  if (checkout) params.set("checkout_date", checkout);

  const guests = sanitizeGuestCount(occupancyTotal(value));
  if (guests != null && guests > 0) params.set("guests", String(guests));

  if (value.adults > 0) params.set("adults", String(value.adults));
  if (value.children > 0) params.set("children", String(value.children));
  if (value.infants > 0) params.set("infants", String(value.infants));
  if (value.pets > 0) params.set("pets", String(value.pets));

  if (value.listingType && value.listingType !== "all") {
    params.set("listing_type", value.listingType);
  }

  if (extras?.verified) params.set("verified_walkthrough_only", "true");
  if (extras?.instant) params.set("instant_booking_only", "true");
  if (extras?.sort && extras.sort !== "newest") params.set("sort", extras.sort);
  if (extras?.vibe) params.set("vibe", extras.vibe);
  if (extras?.collection) params.set("collection", extras.collection);
  if (extras?.neighborhood && city) {
    params.set("neighborhood", extras.neighborhood);
  }

  return params;
}

export function searchBarValueFromSearchParams(
  sp: URLSearchParams | { get: (k: string) => string | null },
): SearchBarValue {
  const city = sanitizeCityInput(sp.get("city") || "");
  const checkin = sanitizeDateInput(sp.get("checkin_date") || "");
  const checkout = sanitizeDateInput(sp.get("checkout_date") || "");
  const listingType = (sp.get("listing_type") || "all").toUpperCase();
  const guests = sanitizeGuestCount(sp.get("guests") || "") ?? 0;

  const adultsRaw = sp.get("adults");
  const childrenRaw = sp.get("children");
  const infantsRaw = sp.get("infants");
  const petsRaw = sp.get("pets");

  let adults = adultsRaw != null ? clampGuestPart(parseInt(adultsRaw, 10)) : 0;
  let children = childrenRaw != null ? clampGuestPart(parseInt(childrenRaw, 10)) : 0;
  const infants = infantsRaw != null ? clampGuestPart(parseInt(infantsRaw, 10)) : 0;
  const pets = petsRaw != null ? clampGuestPart(parseInt(petsRaw, 10)) : 0;

  if (adultsRaw == null && childrenRaw == null) {
    adults = guests > 0 ? guests : 1;
    children = 0;
  } else if (adults === 0 && children === 0) {
    adults = 1;
  }

  const dest =
    findDestinationById(sp.get("destination") || "") ??
    findDestinationByCity(city);

  return {
    ...DEFAULT_SEARCH_BAR_VALUE,
    destinationId: dest?.id ?? null,
    city: dest?.resolveCity ?? city,
    checkin,
    checkout,
    adults,
    children,
    infants,
    pets,
    listingType:
      listingType === "ALL" || !listingType ? "all" : listingType,
  };
}
