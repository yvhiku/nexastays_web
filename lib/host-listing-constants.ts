export const LISTING_TYPES = [
  { id: "APARTMENT" as const, label: "Apartment" },
  { id: "VILLA" as const, label: "Villa" },
  { id: "RIAD" as const, label: "Riad" },
  { id: "HOTEL" as const, label: "Hotel" },
  { id: "HOSTEL" as const, label: "Hostel" },
];

export const AMENITY_OPTIONS = [
  { tag: "wifi", emoji: "🌐", label: "WiFi" },
  { tag: "parking", emoji: "🅿️", label: "Parking" },
  { tag: "ac", emoji: "❄️", label: "Air conditioning" },
  { tag: "heating", emoji: "🔥", label: "Heating" },
  { tag: "hot_water", emoji: "🫧", label: "Hot water" },
  { tag: "kitchen", emoji: "🍳", label: "Kitchen" },
  { tag: "washing_machine", emoji: "🧺", label: "Washing machine" },
  { tag: "tv", emoji: "📺", label: "TV" },
  { tag: "pool", emoji: "🏊", label: "Pool" },
  { tag: "elevator", emoji: "🛗", label: "Elevator" },
  { tag: "accessible", emoji: "♿", label: "Accessible" },
  { tag: "safe", emoji: "🔒", label: "Safe box" },
  { tag: "coffee", emoji: "☕", label: "Coffee" },
  { tag: "gym", emoji: "🏋️", label: "Gym" },
  { tag: "garden", emoji: "🌿", label: "Garden / terrace" },
  { tag: "cleaning", emoji: "🧹", label: "Daily cleaning" },
];

const AMENITY_LABEL_BY_TAG = Object.fromEntries(
  AMENITY_OPTIONS.map((a) => [a.tag, a.label]),
) as Record<string, string>;

/** Normalize amenities from API (array or legacy string). */
export function normalizeAmenities(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      }
    } catch {
      // not JSON — fall through
    }
    return trimmed.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function amenityLabel(tag: string): string {
  return AMENITY_LABEL_BY_TAG[tag] ?? tag.replace(/_/g, " ");
}
