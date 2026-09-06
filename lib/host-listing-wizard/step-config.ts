import type {
  BookingModel,
  ListingType,
  WizardStepDef,
} from "./form-types";
import { roomsRequiredForType } from "./completion";

/** i18n keys under `hostListing.wizard.types.<TYPE>.*` */
export const PROPERTY_TYPE_COPY: Record<
  ListingType,
  { labelKey: string; supportKey: string }
> = {
  APARTMENT: {
    labelKey: "hostListing.wizard.types.APARTMENT.label",
    supportKey: "hostListing.wizard.types.APARTMENT.support",
  },
  VILLA: {
    labelKey: "hostListing.wizard.types.VILLA.label",
    supportKey: "hostListing.wizard.types.VILLA.support",
  },
  RIAD: {
    labelKey: "hostListing.wizard.types.RIAD.label",
    supportKey: "hostListing.wizard.types.RIAD.support",
  },
  HOTEL: {
    labelKey: "hostListing.wizard.types.HOTEL.label",
    supportKey: "hostListing.wizard.types.HOTEL.support",
  },
  HOSTEL: {
    labelKey: "hostListing.wizard.types.HOSTEL.label",
    supportKey: "hostListing.wizard.types.HOSTEL.support",
  },
};

/** Guest House is UI-only; maps to APARTMENT + guest_house flag. */
export const GUEST_HOUSE_UI = {
  id: "GUEST_HOUSE" as const,
  labelKey: "hostListing.wizard.types.GUEST_HOUSE.label",
  supportKey: "hostListing.wizard.types.GUEST_HOUSE.support",
};

export function defaultBookingModel(type: ListingType): BookingModel {
  if (type === "HOTEL") return "ROOM_TYPES";
  if (type === "HOSTEL") return "DORM_AND_PRIVATE";
  return "ENTIRE_PROPERTY";
}

export function isMultiUnitFlow(
  type: ListingType | null,
  model: BookingModel | null,
): boolean {
  return roomsRequiredForType(type, model);
}

/**
 * Adaptive wizard AFTER property type is chosen and DRAFT exists.
 * Labels/descriptions are i18n keys resolved by the shell.
 */
export function getWizardSteps(
  type: ListingType | null,
  model: BookingModel | null,
): WizardStepDef[] {
  if (!type) return [];

  const rooms = roomsRequiredForType(type, model);
  const aboutLabelKey =
    type === "HOTEL"
      ? "hostListing.wizard.steps.aboutHotel"
      : type === "HOSTEL"
        ? "hostListing.wizard.steps.aboutHostel"
        : "hostListing.wizard.steps.about";

  const steps: WizardStepDef[] = [
    {
      id: "location",
      labelKey: "hostListing.wizard.steps.location",
      descriptionKey: "hostListing.wizard.steps.locationDesc",
    },
    {
      id: "about",
      labelKey: aboutLabelKey,
      descriptionKey: "hostListing.wizard.steps.aboutDesc",
    },
  ];

  if (rooms) {
    steps.push({
      id: "unitTypes",
      labelKey:
        type === "HOSTEL"
          ? "hostListing.wizard.steps.roomsAndDorms"
          : "hostListing.wizard.steps.roomTypes",
      descriptionKey: "hostListing.wizard.steps.unitTypesDesc",
    });
  }

  steps.push(
    {
      id: "pricing",
      labelKey: rooms
        ? "hostListing.wizard.steps.roomPricing"
        : "hostListing.wizard.steps.pricing",
      descriptionKey: rooms
        ? "hostListing.wizard.steps.roomPricingDesc"
        : "hostListing.wizard.steps.pricingDesc",
    },
    {
      id: "media",
      labelKey: "hostListing.wizard.steps.photos",
      descriptionKey: "hostListing.wizard.steps.photosDesc",
    },
    {
      id: "amenitiesRules",
      labelKey: "hostListing.wizard.steps.amenitiesRules",
      descriptionKey: "hostListing.wizard.steps.amenitiesRulesDesc",
      optional: true,
    },
    {
      id: "submit",
      labelKey: "hostListing.wizard.steps.submit",
      descriptionKey: "hostListing.wizard.steps.submitDesc",
    },
  );

  return steps;
}
