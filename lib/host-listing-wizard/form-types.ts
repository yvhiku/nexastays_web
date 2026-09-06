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

export type PhotoUploadStatus = "pending" | "uploading" | "uploaded" | "error";

export interface WizardPhoto {
  /**
   * Client-generated id (`crypto.randomUUID()`). The ONLY key the grid,
   * reorder, and remove ever use — never the server asset id.
   */
  id: string;
  /** Local file pending upload; null when already saved on the server. */
  file: File | null;
  /** Server asset reference; set once the upload resolves. */
  assetId?: string;
  preview: string;
  category: MediaCategory;
  isCover: boolean;
  uploadStatus: PhotoUploadStatus;
  uploadError?: string;
}

export interface ListingWizardFormState {
  listingType: ListingType | null;
  bookingModel: BookingModel | null;
  /** UI Guest House → APARTMENT + property_details.guest_house */
  guestHouse: boolean;
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
  unitTypes: UnitTypeDraft[];
  photos: WizardPhoto[];
  walkthrough: File | null;
  walkthroughPreview: string | null;
  walkthroughAssetId?: string | null;
}

export type WizardStepId =
  | "location"
  | "about"
  | "unitTypes"
  | "pricing"
  | "media"
  | "amenitiesRules"
  | "submit";

export interface WizardStepDef {
  id: WizardStepId;
  /** i18n key under `hostListing.wizard.steps.*` */
  labelKey: string;
  /** i18n key under `hostListing.wizard.steps.*` */
  descriptionKey: string;
  /** Skipping never blocks submit. */
  optional?: boolean;
}

/** i18n message reference: key + interpolation vars. */
export interface WizardMessage {
  key: string;
  vars?: Record<string, string | number>;
}

/** Field-level validation errors keyed by form field (or synthetic key like `photos`). */
export type WizardFieldErrors = Record<string, WizardMessage>;
