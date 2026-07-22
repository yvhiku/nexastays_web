export type ExploreCollectionFilters = {
  city?: string;
  listing_type?: "APARTMENT" | "HOTEL" | "RIAD" | "VILLA" | "HOSTEL";
  guests?: number;
  verified_walkthrough_only?: boolean;
  instant_booking_only?: boolean;
};

export type ExploreCollection = {
  id: string;
  titleKey: string;
  image: string;
  objectPosition?: string;
  filters: ExploreCollectionFilters;
};

/** Data-driven collections — swap for API later; same component hosts Editor's Picks / seasonal. */
export const EXPLORE_COLLECTIONS: ExploreCollection[] = [
  {
    id: "historic-riads",
    titleKey: "explore.collectionHistoricRiads",
    image: "/images/assets/riad-magic.jpg",
    objectPosition: "center 55%",
    filters: { listing_type: "RIAD" },
  },
  {
    id: "ocean-stays",
    titleKey: "explore.collectionOceanStays",
    image: "/images/assets/ocean-view.jpg",
    objectPosition: "center center",
    filters: { city: "Agadir" },
  },
  {
    id: "family-villas",
    titleKey: "explore.collectionFamilyVillas",
    image: "/images/assets/family-ready.jpg",
    objectPosition: "left center",
    filters: { listing_type: "VILLA", guests: 4 },
  },
  {
    id: "business-apartments",
    titleKey: "explore.collectionBusinessApartments",
    image: "/images/assets/cozy.jpg",
    objectPosition: "center 40%",
    filters: { listing_type: "APARTMENT", city: "Casablanca" },
  },
  {
    id: "luxury-retreats",
    titleKey: "explore.collectionLuxuryRetreats",
    image: "/images/assets/luxury.jpg",
    objectPosition: "center 35%",
    filters: { listing_type: "VILLA" },
  },
  {
    id: "mountain-escapes",
    titleKey: "explore.collectionMountainEscapes",
    image: "/images/assets/rooftop-riad.jpg",
    objectPosition: "center 45%",
    filters: { city: "Ifrane" },
  },
];

export function getCollectionById(id: string | null | undefined) {
  if (!id) return null;
  return EXPLORE_COLLECTIONS.find((c) => c.id === id) ?? null;
}

/** Contextual collections — city-tagged items surface first. */
export function getCollectionsForContext(city?: string, limit = 6): ExploreCollection[] {
  const normalized = city?.trim();
  const items = [...EXPLORE_COLLECTIONS];
  if (normalized) {
    items.sort((a, b) => {
      const aMatch = a.filters.city?.toLowerCase() === normalized.toLowerCase() ? 1 : 0;
      const bMatch = b.filters.city?.toLowerCase() === normalized.toLowerCase() ? 1 : 0;
      return bMatch - aMatch;
    });
  }
  return items.slice(0, limit);
}
