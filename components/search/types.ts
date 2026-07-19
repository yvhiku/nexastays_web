export type SearchBarValue = {
  destinationId: string | null;
  city: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  listingType: string;
};

export const DEFAULT_SEARCH_BAR_VALUE: SearchBarValue = {
  destinationId: null,
  city: "",
  checkin: "",
  checkout: "",
  adults: 1,
  children: 0,
  infants: 0,
  pets: 0,
  listingType: "all",
};

export type SearchOpenField = null | "where" | "when" | "guests";

export const STAY_TYPE_OPTIONS = [
  "all",
  "APARTMENT",
  "VILLA",
  "HOTEL",
  "RIAD",
  "HOSTEL",
] as const;

export type StayTypeOption = (typeof STAY_TYPE_OPTIONS)[number];
