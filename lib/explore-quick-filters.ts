export type QuickFilterFilters = {
  verified_walkthrough_only?: boolean;
  instant_booking_only?: boolean;
  listing_type?: string;
};

export type ExploreQuickFilter = {
  id: string;
  labelKey: string;
  filters: QuickFilterFilters;
};

/** One-click chips under SearchBar — only flags the API supports today. */
export const EXPLORE_QUICK_FILTERS: ExploreQuickFilter[] = [
  {
    id: "instant",
    labelKey: "explore.quickInstant",
    filters: { instant_booking_only: true },
  },
  {
    id: "verified",
    labelKey: "explore.quickVerified",
    filters: { verified_walkthrough_only: true },
  },
  {
    id: "riads",
    labelKey: "explore.quickRiads",
    filters: { listing_type: "RIAD" },
  },
  {
    id: "apartments",
    labelKey: "explore.quickApartments",
    filters: { listing_type: "APARTMENT" },
  },
  {
    id: "villas",
    labelKey: "explore.quickVillas",
    filters: { listing_type: "VILLA" },
  },
];
