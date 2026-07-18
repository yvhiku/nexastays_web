import type {
  BookingModel,
  ListingType,
  WizardStepDef,
} from "./form-types";
import { roomsRequiredForType } from "./completion";

export const PROPERTY_TYPE_COPY: Record<
  ListingType,
  { label: string; support: string; selected: string }
> = {
  APARTMENT: {
    label: "Apartment",
    support: "A flat, studio, or private residential unit.",
    selected: "You'll set up an apartment listing.",
  },
  VILLA: {
    label: "Villa",
    support: "A private house, usually with outdoor space.",
    selected: "You'll set up a villa listing.",
  },
  RIAD: {
    label: "Riad",
    support: "A traditional Moroccan home.",
    selected: "You'll set up a riad listing.",
  },
  HOTEL: {
    label: "Hotel",
    support: "Managed stay with room categories and quantities.",
    selected: "You'll add hotel room types next.",
  },
  HOSTEL: {
    label: "Hostel",
    support: "Shared dorm beds, private rooms, or both.",
    selected: "You'll configure dorms and rooms next.",
  },
};

/** Guest House is UI-only; maps to APARTMENT + guest_house flag. */
export const GUEST_HOUSE_UI = {
  id: "GUEST_HOUSE" as const,
  label: "Guest House",
  support: "A small hospitality property — maps to apartment inventory for now.",
};

export function defaultBookingModel(type: ListingType): BookingModel {
  if (type === "HOTEL") return "ROOM_TYPES";
  if (type === "HOSTEL") return "DORM_AND_PRIVATE";
  return "ENTIRE_PROPERTY";
}

export function bookingModelOptions(type: ListingType): Array<{
  id: BookingModel;
  label: string;
  support: string;
}> {
  // Kept for compatibility; wizard no longer asks this for apartments.
  if (type === "HOTEL") {
    return [{ id: "ROOM_TYPES", label: "Hotel room types", support: "" }];
  }
  if (type === "HOSTEL") {
    return [
      { id: "DORM_AND_PRIVATE", label: "Dorms and private rooms", support: "" },
    ];
  }
  return [{ id: "ENTIRE_PROPERTY", label: "Entire place", support: "" }];
}

export function isMultiUnitFlow(
  type: ListingType | null,
  model: BookingModel | null,
): boolean {
  return roomsRequiredForType(type, model);
}

/** Adaptive wizard AFTER property type is chosen and DRAFT exists. */
export function getWizardSteps(
  type: ListingType | null,
  model: BookingModel | null,
): WizardStepDef[] {
  if (!type) return [];

  const rooms = roomsRequiredForType(type, model);
  const aboutLabel =
    type === "HOTEL" ? "About hotel" : type === "HOSTEL" ? "About hostel" : "About";
  const pricingLabel = rooms ? "Room pricing" : "Pricing";

  const steps: WizardStepDef[] = [
    {
      id: "location",
      label: "Location",
      description: "Where is the property?",
    },
    {
      id: "about",
      label: aboutLabel,
      description: "Basics and property details",
    },
  ];

  if (rooms) {
    steps.push({
      id: "unitTypes",
      label: type === "HOSTEL" ? "Rooms & dorms" : "Room types",
      description: "Inventory and capacity",
    });
  }

  steps.push(
    {
      id: "pricing",
      label: pricingLabel,
      description: rooms ? "Price each room type" : "Nightly price",
    },
    {
      id: "media",
      label: "Photos",
      description: "Photo workspace",
    },
    {
      id: "submit",
      label: "Submit",
      description: "Checklist and send for review",
    },
  );

  return steps;
}

/** @deprecated — booking structure step removed from create flow */
export function getWizardStepsLegacy(
  type: ListingType | null,
  model: BookingModel | null,
): WizardStepDef[] {
  return getWizardSteps(type, model);
}
