import { MOROCCO_CONTEXT } from "@/lib/explore-city-context";

/** Client-side listing counts — align with SEO cache when available. */
const CITY_LISTING_COUNTS: Record<string, number> = {
  Marrakech: 610,
  Casablanca: 324,
  Agadir: 186,
  Tangier: 120,
  Rabat: 98,
  Fes: 142,
  Essaouira: 88,
  Chefchaouen: 54,
  Tetouan: 41,
  Ifrane: 36,
};

export type ExploreDestinationCard = {
  city: string;
  listingCount: number;
  image?: string;
};

const CITY_IMAGES: Record<string, string> = {
  Marrakech: "/images/assets/riad-magic.jpg",
  Casablanca: "/images/assets/cozy.jpg",
  Agadir: "/images/assets/ocean-view.jpg",
  Tangier: "/images/assets/ocean-view.jpg",
  Rabat: "/images/assets/cozy.jpg",
  Fes: "/images/assets/riad-magic.jpg",
  Essaouira: "/images/assets/ocean-view.jpg",
  Chefchaouen: "/images/assets/rooftop-riad.jpg",
  Tetouan: "/images/assets/cozy.jpg",
  Ifrane: "/images/assets/rooftop-riad.jpg",
};

export function getExploreDestinationCards(): ExploreDestinationCard[] {
  return MOROCCO_CONTEXT.popularCities.map((city) => ({
    city,
    listingCount: CITY_LISTING_COUNTS[city] ?? 24,
    image: CITY_IMAGES[city],
  }));
}
