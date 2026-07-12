import type {
  BookingModel,
  ListingType,
  WizardStepDef,
} from "./form-types";

export const PROPERTY_TYPE_COPY: Record<
  ListingType,
  { label: string; support: string; selected: string }
> = {
  APARTMENT: {
    label: "Apartment",
    support: "A flat, studio, or private residential unit guests book as one place.",
    selected: "You’ll set up one apartment guests can book for the whole stay.",
  },
  VILLA: {
    label: "Villa",
    support: "A private house, usually with outdoor space like a garden or pool.",
    selected: "You’ll set up a private villa listing for guests.",
  },
  RIAD: {
    label: "Riad",
    support: "A traditional Moroccan home — rent the whole riad, rooms, or both.",
    selected: "Next you’ll choose whether guests book the full riad or individual rooms.",
  },
  HOTEL: {
    label: "Hotel",
    support: "A managed stay with room categories (e.g. Standard, Deluxe) and quantities.",
    selected: "You’ll add hotel room types and how many of each you have.",
  },
  HOSTEL: {
    label: "Hostel",
    support: "Shared dorm beds, private rooms, or a mix of both.",
    selected: "You’ll choose dorm beds, private rooms, or both — with clear per-bed or per-room prices.",
  },
};

export function bookingModelOptions(type: ListingType): Array<{
  id: BookingModel;
  label: string;
  support: string;
}> {
  if (type === "APARTMENT" || type === "VILLA") {
    return [
      {
        id: "ENTIRE_PROPERTY",
        label: "Entire place",
        support: "Guests get the whole apartment or villa to themselves.",
      },
      {
        id: "PRIVATE_ROOM",
        label: "Private room only",
        support: "Guests book one private bedroom; other spaces may be shared.",
      },
      {
        id: "MULTI_UNIT",
        label: "Several similar units",
        support: "You manage more than one similar apartment/villa under this property (e.g. 3 identical studios).",
      },
    ];
  }
  if (type === "RIAD") {
    return [
      {
        id: "ENTIRE_PROPERTY",
        label: "Entire riad",
        support: "One booking for the full riad — like a private house.",
      },
      {
        id: "ROOM_TYPES",
        label: "Individual rooms",
        support: "Guests book a room category (e.g. Patio Room). You set how many of each.",
      },
      {
        id: "BOTH",
        label: "Entire riad and rooms",
        support: "Offer the full riad and also sell rooms separately when available.",
      },
    ];
  }
  if (type === "HOTEL") {
    return [
      {
        id: "ROOM_TYPES",
        label: "Hotel room types",
        support: "Create categories like Standard Double or Suite, each with a quantity and nightly price.",
      },
    ];
  }
  return [
    {
      id: "DORM_BEDS",
      label: "Dorm beds only",
      support: "Guests book a bed in a shared dorm. Price is per bed, per night.",
    },
    {
      id: "PRIVATE_ROOMS",
      label: "Private rooms only",
      support: "Guests book a private room. Price is per room, per night.",
    },
    {
      id: "DORM_AND_PRIVATE",
      label: "Dorms and private rooms",
      support: "Offer both shared dorm beds and private rooms on the same listing.",
    },
  ];
}

export function isMultiUnitFlow(
  type: ListingType | null,
  model: BookingModel | null,
): boolean {
  if (!type || !model) return false;
  if (type === "HOTEL") return true;
  if (type === "HOSTEL") return true;
  if (type === "RIAD" && (model === "ROOM_TYPES" || model === "BOTH")) return true;
  if (model === "MULTI_UNIT") return true;
  return false;
}

export function getWizardSteps(
  type: ListingType | null,
  model: BookingModel | null,
): WizardStepDef[] {
  const multi = isMultiUnitFlow(type, model);

  if (!type) {
    return [
      {
        id: "propertyType",
        label: "Property Type",
        description: "Tell us what guests can book.",
      },
    ];
  }

  if (!model) {
    return [
      {
        id: "propertyType",
        label: "Property Type",
        description: "Tell us what guests can book.",
      },
      {
        id: "bookingModel",
        label: "Booking Structure",
        description: "How can guests book this property?",
      },
    ];
  }

  if (type === "HOTEL") {
    return [
      { id: "propertyType", label: "Hotel Type", description: "Confirm the property category." },
      { id: "bookingModel", label: "Booking Structure", description: "Rooms are sold as room types." },
      { id: "location", label: "Location", description: "Address stays private until confirmed." },
      { id: "details", label: "Hotel Information", description: "Business and property basics." },
      { id: "unitTypes", label: "Room Types", description: "Inventory by room type, not every door." },
      { id: "amenities", label: "Services and Amenities", description: "Shared facilities guests expect." },
      { id: "policies", label: "Policies and Check-in", description: "Rules, safety and arrival." },
      { id: "pricing", label: "Rates", description: "Default nightly rates and fees." },
      { id: "media", label: "Photos and Video", description: "Property and room photography." },
      { id: "review", label: "Review and Submit", description: "Check everything before review." },
    ];
  }

  if (type === "HOSTEL") {
    return [
      { id: "propertyType", label: "Hostel Type", description: "Confirm the property category." },
      { id: "bookingModel", label: "Booking Structure", description: "Dorms, private rooms, or both." },
      { id: "location", label: "Location", description: "Address stays private until confirmed." },
      { id: "details", label: "Hostel Information", description: "Shared spaces and house culture." },
      { id: "unitTypes", label: "Beds and Rooms", description: "Dorm beds and private rooms." },
      { id: "amenities", label: "Shared Spaces", description: "Kitchen, lounge, lockers and more." },
      { id: "policies", label: "Guest Policies", description: "Age, gender, curfew and safety." },
      { id: "pricing", label: "Pricing", description: "Per-bed and per-room rates." },
      { id: "media", label: "Photos and Video", description: "Common areas and room types." },
      { id: "review", label: "Review and Submit", description: "Check everything before review." },
    ];
  }

  if (type === "VILLA") {
    return [
      { id: "propertyType", label: "Property Type", description: "Tell us what guests can book." },
      { id: "bookingModel", label: "Booking Structure", description: "Entire villa or rooms." },
      { id: "location", label: "Location", description: "Address stays private until confirmed." },
      { id: "details", label: "Villa Layout", description: "Indoor and outdoor spaces." },
      ...(multi
        ? [{ id: "unitTypes" as const, label: "Units", description: "Separate units under this villa." }]
        : []),
      { id: "amenities", label: "Amenities", description: "Garden, pool, parking and more." },
      { id: "policies", label: "Rules and Safety", description: "Policies guests see before booking." },
      { id: "pricing", label: "Pricing and Availability", description: "Nightly rates and fees." },
      { id: "media", label: "Photos and Walkthrough", description: "Indoor and outdoor media." },
      { id: "review", label: "Verification and Submit", description: "Final check before review." },
    ];
  }

  if (type === "RIAD") {
    return [
      { id: "propertyType", label: "Property Type", description: "Tell us what guests can book." },
      { id: "bookingModel", label: "Booking Structure", description: "Entire riad, rooms, or both." },
      { id: "location", label: "Location", description: "Address stays private until confirmed." },
      { id: "details", label: "Riad Details", description: "Courtyard, rooftop and services." },
      ...(multi
        ? [{ id: "unitTypes" as const, label: "Rooms", description: "Room types with quantities." }]
        : []),
      { id: "amenities", label: "Services and Amenities", description: "Breakfast, hammam, staff." },
      { id: "policies", label: "Policies", description: "House rules and check-in." },
      { id: "pricing", label: "Pricing", description: "Nightly rates and fees." },
      { id: "media", label: "Photos and Video", description: "Property and room media." },
      { id: "review", label: "Verification and Submit", description: "Final check before review." },
    ];
  }

  // Apartment default
  return [
    { id: "propertyType", label: "Property Type", description: "Tell us what guests can book." },
    { id: "bookingModel", label: "Booking Structure", description: "Entire place or private room." },
    { id: "location", label: "Location", description: "Address stays private until confirmed." },
    { id: "details", label: "Apartment Details", description: "Layout, beds and capacity." },
    ...(multi
      ? [{ id: "unitTypes" as const, label: "Units", description: "Separate units on this property." }]
      : []),
    { id: "amenities", label: "Amenities", description: "What guests get with the stay." },
    { id: "policies", label: "Rules and Check-in", description: "Policies and arrival details." },
    { id: "pricing", label: "Pricing and Availability", description: "Nightly rates and fees." },
    { id: "media", label: "Photos and Walkthrough", description: "Categorized photos and video." },
    { id: "review", label: "Verification and Submit", description: "Final check before review." },
  ];
}
