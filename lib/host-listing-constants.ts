import type { CreateHostListingBody } from "./stays-types";

export const LISTING_WIZARD_STEPS = [
  "Property Type",
  "Location & Basics",
  "House Rules",
  "Amenities",
  "Pricing",
  "Check-in Contact",
  "Photos",
  "Walkthrough & Submit",
] as const;

export const MIN_LISTING_PHOTOS = 12;

export const LISTING_TYPES = [
  { id: "APARTMENT" as const, emoji: "🏠", label: "Apartment" },
  { id: "VILLA" as const, emoji: "🏡", label: "Villa" },
  { id: "RIAD" as const, emoji: "🕌", label: "Riad" },
  { id: "HOTEL" as const, emoji: "🏨", label: "Hotel" },
  { id: "HOSTEL" as const, emoji: "🛏️", label: "Hostel" },
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

export interface ListingWizardForm {
  listingType: CreateHostListingBody["listing_type"];
  title: string;
  city: string;
  address: string;
  description: string;
  maxGuests: number;
  petsPolicy: "ALLOWED" | "DOGS_CATS" | "NO";
  smokingPolicy: "ALLOWED" | "NOT_ALLOWED";
  quietHours: boolean;
  couplesWelcome: boolean;
  cancellationPolicy: "FLEXIBLE" | "MODERATE" | "STRICT";
  amenities: string[];
  basePrice: string;
  weekendPrice: string;
  cleaningFee: string;
  checkinTime: string;
  checkoutTime: string;
  contactName: string;
  contactPhone: string;
  contactRole: "OWNER" | "CO_HOST" | "AGENT";
  photos: File[];
  photoPreviews: string[];
  walkthrough: File | null;
  walkthroughPreview: string | null;
}

export const defaultListingForm = (): ListingWizardForm => ({
  listingType: "APARTMENT",
  title: "",
  city: "",
  address: "",
  description: "",
  maxGuests: 2,
  petsPolicy: "NO",
  smokingPolicy: "NOT_ALLOWED",
  quietHours: true,
  couplesWelcome: true,
  cancellationPolicy: "MODERATE",
  amenities: [],
  basePrice: "",
  weekendPrice: "",
  cleaningFee: "0",
  checkinTime: "14:00",
  checkoutTime: "11:00",
  contactName: "",
  contactPhone: "",
  contactRole: "OWNER",
  photos: [],
  photoPreviews: [],
  walkthrough: null,
  walkthroughPreview: null,
});
