/**
 * Static option tables for the wizard steps. Labels are i18n keys so the
 * step components stay declarative; resolve with `t(labelKey)` at render.
 */
import type { ListingType, MediaCategory, UnitTypeDraft } from "./form-types";

const W = "hostListing.wizard.";

export const MAX_GUEST_OPTIONS = Array.from({ length: 15 }, (_, i) => String(i + 1));
export const ROOM_QUANTITY_OPTIONS = Array.from({ length: 100 }, (_, i) => String(i + 1));

export const MEDIA_CATEGORIES: Array<{ id: MediaCategory; labelKey: string }> = [
  "EXTERIOR",
  "ENTRANCE",
  "LIVING",
  "BEDROOM",
  "BATHROOM",
  "KITCHEN",
  "BALCONY",
  "OUTDOOR",
  "COMMON",
  "RECEPTION",
  "ROOM",
  "DORM",
  "FACILITIES",
  "OTHER",
].map((id) => ({
  id: id as MediaCategory,
  labelKey: `${W}mediaCategories.${id}`,
}));

/** Suggested shots that make a strong listing. */
export const RECOMMENDED_SHOTS: MediaCategory[] = [
  "BEDROOM",
  "KITCHEN",
  "BATHROOM",
  "LIVING",
  "EXTERIOR",
];

export const VILLA_FEATURES: Array<{ key: string; labelKey: string }> = [
  "garden",
  "pool",
  "terrace",
  "parking",
  "barbecue",
  "gated",
].map((key) => ({ key, labelKey: `${W}features.${key}` }));

export const SHARED_FEATURES: Array<{ key: string; labelKey: string }> = [
  "courtyard",
  "rooftop",
  "breakfast",
  "hammam",
  "reception",
  "laundry",
  "lockers",
  "coworking",
].map((key) => ({ key, labelKey: `${W}features.${key}` }));

export const SAFETY_KEYS = [
  "smoke_detector",
  "co_detector",
  "fire_extinguisher",
  "first_aid",
  "emergency_exit",
  "security_cameras",
] as const;

export function safetyLabelKey(key: string): string {
  return `${W}safety.${key}`;
}

export const UNIT_KIND_LABEL_KEY: Record<UnitTypeDraft["kind"], string> = {
  APARTMENT_UNIT: `${W}unitKinds.APARTMENT_UNIT`,
  VILLA_UNIT: `${W}unitKinds.VILLA_UNIT`,
  HOTEL_ROOM: `${W}unitKinds.HOTEL_ROOM`,
  RIAD_ROOM: `${W}unitKinds.RIAD_ROOM`,
  HOSTEL_DORM: `${W}unitKinds.HOSTEL_DORM`,
  HOSTEL_PRIVATE: `${W}unitKinds.HOSTEL_PRIVATE`,
};

export const DORM_GENDER_OPTIONS = ["mixed", "female", "male"] as const;

/** About-step header copy varies by property type. */
export function aboutCopyKeys(type: ListingType | null): {
  eyebrowKey: string;
  titleKey: string;
  descriptionKey: string;
} {
  const t = type ?? "APARTMENT";
  return {
    eyebrowKey: `${W}about.${t}.eyebrow`,
    titleKey: `${W}about.${t}.title`,
    descriptionKey: `${W}about.${t}.description`,
  };
}
