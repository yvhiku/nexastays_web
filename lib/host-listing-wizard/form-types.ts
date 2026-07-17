export type ListingType = "APARTMENT" | "VILLA" | "RIAD" | "HOTEL" | "HOSTEL";

export type BookingModel =
  | "ENTIRE_PROPERTY"
  | "PRIVATE_ROOM"
  | "MULTI_UNIT"
  | "ROOM_TYPES"
  | "DORM_BEDS"
  | "PRIVATE_ROOMS"
  | "DORM_AND_PRIVATE"
  | "BOTH";

export type UnitKind =
  | "APARTMENT_UNIT"
  | "VILLA_UNIT"
  | "HOTEL_ROOM"
  | "RIAD_ROOM"
  | "HOSTEL_DORM"
  | "HOSTEL_PRIVATE";

export type PricingUnit = "NIGHT" | "BED_NIGHT" | "ROOM_NIGHT";

export type MediaCategory =
  | "EXTERIOR"
  | "ENTRANCE"
  | "LIVING"
  | "BEDROOM"
  | "BATHROOM"
  | "KITCHEN"
  | "BALCONY"
  | "WORKSPACE"
  | "FACILITIES"
  | "PARKING"
  | "OUTDOOR"
  | "COMMON"
  | "RECEPTION"
  | "ROOM"
  | "DORM"
  | "OTHER";

export interface BedroomConfig {
  id: string;
  label: string;
  bedSummary: string;
  sleeps: number;
  privateBathroom: boolean;
}

export interface UnitTypeDraft {
  id: string;
  kind: UnitKind;
  name: string;
  quantity: number;
  maxGuests: number;
  bedConfig: string;
  sizeSqm: string;
  amenities: string[];
  pricingUnit: PricingUnit;
  basePrice: string;
  details: Record<string, unknown>;
  isActive: boolean;
}

export interface WizardPhoto {
  id: string;
  file: File;
  preview: string;
  category: MediaCategory;
  isCover: boolean;
}

export interface ListingWizardFormState {
  listingType: ListingType | null;
  bookingModel: BookingModel | null;
  title: string;
  country: string;
  city: string;
  neighborhood: string;
  address: string;
  buildingName: string;
  postalCode: string;
  landmark: string;
  geoLat: number | null;
  geoLng: number | null;
  description: string;
  maxGuests: number;
  bedrooms: BedroomConfig[];
  sizeSqm: string;
  propertyDetails: Record<string, unknown>;
  petsPolicy: "ALLOWED" | "DOGS_CATS" | "NO";
  smokingPolicy: "ALLOWED" | "NOT_ALLOWED";
  quietHours: boolean;
  couplesWelcome: boolean;
  childrenAllowed: boolean;
  visitorsAllowed: boolean;
  partiesAllowed: boolean;
  minStay: number;
  maxStay: number;
  cancellationPolicy: "FLEXIBLE" | "MODERATE" | "STRICT";
  amenities: string[];
  safety: Record<string, boolean>;
  checkinTime: string;
  checkoutTime: string;
  checkinMethod: "SELF" | "IN_PERSON" | "RECEPTION";
  contactName: string;
  contactPhone: string;
  contactRole: "OWNER" | "CO_HOST" | "AGENT";
  accessInstructions: string;
  guestLanguage: string;
  basePrice: string;
  weekendPrice: string;
  cleaningFee: string;
  unitTypes: UnitTypeDraft[];
  photos: WizardPhoto[];
  walkthrough: File | null;
  walkthroughPreview: string | null;
}

export type WizardStepId =
  | "propertyType"
  | "bookingModel"
  | "location"
  | "details"
  | "unitTypes"
  | "amenities"
  | "policies"
  | "pricing"
  | "media"
  | "review";

export interface WizardStepDef {
  id: WizardStepId;
  label: string;
  description: string;
}
