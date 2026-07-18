import type {
  BedroomConfig,
  ListingWizardFormState,
  UnitTypeDraft,
} from "./form-types";

export function newBedroom(index = 1): BedroomConfig {
  return {
    id: crypto.randomUUID(),
    label: `Bedroom ${index}`,
    bedSummary: "1 queen bed",
    sleeps: 2,
    privateBathroom: false,
  };
}

export function newUnitType(
  kind: UnitTypeDraft["kind"],
  pricingUnit: UnitTypeDraft["pricingUnit"] = "ROOM_NIGHT",
): UnitTypeDraft {
  return {
    id: crypto.randomUUID(),
    kind,
    name: "",
    quantity: 1,
    maxGuests: 2,
    bedConfig: "1 double bed",
    sizeSqm: "",
    amenities: [],
    pricingUnit,
    basePrice: "",
    details: {},
    isActive: true,
  };
}

export function defaultWizardForm(): ListingWizardFormState {
  return {
    listingType: null,
    bookingModel: null,
    guestHouse: false,
    title: "",
    country: "MA",
    city: "",
    neighborhood: "",
    address: "",
    buildingName: "",
    postalCode: "",
    landmark: "",
    geoLat: null,
    geoLng: null,
    description: "",
    maxGuests: 2,
    bedrooms: [newBedroom(1)],
    sizeSqm: "",
    propertyDetails: {},
    petsPolicy: "NO",
    smokingPolicy: "NOT_ALLOWED",
    quietHours: true,
    couplesWelcome: true,
    childrenAllowed: true,
    visitorsAllowed: true,
    partiesAllowed: false,
    minStay: 1,
    maxStay: 30,
    cancellationPolicy: "MODERATE",
    amenities: [],
    safety: {
      smoke_detector: false,
      co_detector: false,
      fire_extinguisher: false,
      first_aid: false,
      emergency_exit: false,
      security_cameras: false,
    },
    checkinTime: "14:00",
    checkoutTime: "11:00",
    checkinMethod: "IN_PERSON",
    contactName: "",
    contactPhone: "",
    contactRole: "OWNER",
    accessInstructions: "",
    guestLanguage: "fr",
    basePrice: "",
    weekendPrice: "",
    cleaningFee: "0",
    unitTypes: [],
    photos: [],
    walkthrough: null,
    walkthroughPreview: null,
    walkthroughAssetId: null,
  };
}

/** @deprecated LocalStorage is no longer the source of truth for drafts. */
export const DRAFT_STORAGE_PREFIX = "nexa_listing_wizard_draft_";
