/**
 * Listing completion flags → weighted %.
 * Mirrors backend/stays listing-completion.ts
 */

export type ListingCompletionFlags = {
  location_complete: boolean;
  about_complete: boolean;
  pricing_complete: boolean;
  photos_complete: boolean;
  photos_quality_complete: boolean;
  rooms_complete: boolean;
  walkthrough_complete: boolean;
  amenities_complete: boolean;
  house_rules_complete: boolean;
};

export const COMPLETION_WEIGHTS = {
  location: 20,
  about: 20,
  pricing: 20,
  photos: 30,
  walkthrough: 5,
  optional: 5,
} as const;

export const SUBMIT_MIN_PHOTOS = 5;
export const QUALITY_TARGET_PHOTOS = 12;

export function roomsRequiredForType(
  listingType: string | null | undefined,
  bookingModel?: string | null,
): boolean {
  if (!listingType) return false;
  if (listingType === "HOTEL" || listingType === "HOSTEL") return true;
  if (listingType === "RIAD") {
    return bookingModel === "ROOM_TYPES" || bookingModel === "BOTH";
  }
  return false;
}

export type CompletionInput = {
  listing_type: string;
  booking_model?: string | null;
  title?: string | null;
  city?: string | null;
  address?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  description?: string | null;
  max_guests?: number | null;
  base_price?: number | null;
  photo_count: number;
  has_walkthrough: boolean;
  unit_count: number;
  amenities_count?: number;
  has_house_rules_touch?: boolean;
};

export function computeCompletionFlags(input: CompletionInput): ListingCompletionFlags {
  const roomsNeeded = roomsRequiredForType(input.listing_type, input.booking_model);
  const pricingOk = roomsNeeded
    ? input.unit_count > 0 && (input.base_price ?? 0) > 0
    : (input.base_price ?? 0) > 0;

  return {
    location_complete: Boolean(
      input.city?.trim() &&
        input.address?.trim() &&
        input.geo_lat != null &&
        input.geo_lng != null,
    ),
    about_complete: Boolean(
      input.title?.trim() &&
        input.title.trim() !== "Untitled listing" &&
        (input.description?.trim()?.length ?? 0) >= 20 &&
        (input.max_guests ?? 0) >= 1,
    ),
    pricing_complete: pricingOk,
    photos_complete: input.photo_count >= SUBMIT_MIN_PHOTOS,
    photos_quality_complete: input.photo_count >= QUALITY_TARGET_PHOTOS,
    rooms_complete: roomsNeeded ? input.unit_count > 0 : true,
    walkthrough_complete: input.has_walkthrough,
    amenities_complete: (input.amenities_count ?? 0) > 0,
    house_rules_complete: Boolean(input.has_house_rules_touch),
  };
}

export function computeCompletionPercentage(flags: ListingCompletionFlags): number {
  let score = 0;
  if (flags.location_complete) score += COMPLETION_WEIGHTS.location;
  if (flags.about_complete) score += COMPLETION_WEIGHTS.about;
  if (flags.pricing_complete) score += COMPLETION_WEIGHTS.pricing;
  if (flags.photos_complete) score += COMPLETION_WEIGHTS.photos;
  if (flags.walkthrough_complete) score += COMPLETION_WEIGHTS.walkthrough;

  const optionalBits = [
    flags.photos_quality_complete,
    flags.amenities_complete,
    flags.house_rules_complete,
  ].filter(Boolean).length;
  if (optionalBits > 0) {
    score += Math.round((COMPLETION_WEIGHTS.optional * optionalBits) / 3);
  }
  if (!flags.rooms_complete) score = Math.min(score, 55);
  return Math.min(100, Math.max(0, score));
}

/** Submit gate. Returns an i18n message (key + vars) or null when submittable. */
export function assertCanSubmit(
  flags: ListingCompletionFlags,
): { key: string; vars?: Record<string, string | number> } | null {
  const K = "hostListing.wizard.submitGate.";
  if (!flags.location_complete) return { key: K + "location" };
  if (!flags.about_complete) return { key: K + "about" };
  if (!flags.rooms_complete) return { key: K + "rooms" };
  if (!flags.pricing_complete) return { key: K + "pricing" };
  if (!flags.photos_complete) {
    return { key: K + "photos", vars: { min: SUBMIT_MIN_PHOTOS } };
  }
  return null;
}

/** Wizard step that owns fixing this checklist item. */
export type MissingStep = "location" | "about" | "unitTypes" | "pricing" | "media";

export type MissingItem = {
  key: string;
  /** i18n key under `hostListing.wizard.missing.*` */
  labelKey: string;
  vars?: Record<string, string | number>;
  required: boolean;
  step: MissingStep;
};

export function listMissing(flags: ListingCompletionFlags): MissingItem[] {
  const K = "hostListing.wizard.missing.";
  const items: MissingItem[] = [];
  if (!flags.location_complete) {
    items.push({ key: "location", labelKey: K + "location", required: true, step: "location" });
  }
  if (!flags.about_complete) {
    items.push({ key: "about", labelKey: K + "about", required: true, step: "about" });
  }
  if (!flags.rooms_complete) {
    items.push({ key: "rooms", labelKey: K + "rooms", required: true, step: "unitTypes" });
  }
  if (!flags.pricing_complete) {
    items.push({ key: "pricing", labelKey: K + "pricing", required: true, step: "pricing" });
  }
  if (!flags.photos_complete) {
    items.push({
      key: "photos",
      labelKey: K + "photos",
      vars: { min: SUBMIT_MIN_PHOTOS },
      required: true,
      step: "media",
    });
  }
  if (!flags.walkthrough_complete) {
    items.push({ key: "walkthrough", labelKey: K + "walkthrough", required: false, step: "media" });
  }
  if (!flags.photos_quality_complete) {
    items.push({
      key: "photos_quality",
      labelKey: K + "photosQuality",
      vars: { count: QUALITY_TARGET_PHOTOS },
      required: false,
      step: "media",
    });
  }
  return items;
}
