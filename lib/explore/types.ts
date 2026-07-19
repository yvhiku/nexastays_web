export type GeoPoint = { lat: number; lng: number };

export type GeoBounds = {
  southwest: GeoPoint;
  northeast: GeoPoint;
};

export type MoroccoRegionId =
  | "casablanca_settat"
  | "marrakech_safi"
  | "souss_massa"
  | "rabat_sale_kenitra"
  | "fes_meknes"
  | "tanger_tetouan_al_hoceima"
  | "oriental"
  | "beni_mellal_khenifra"
  | "draa_tafilalet"
  | "guelmim_oued_noun"
  | "laayoune_sakia_el_hamra"
  | "dakhla_oued_ed_dahab";

export type CityTagId =
  | "economic_capital"
  | "historic_imperial"
  | "capital_city"
  | "europe_africa_gateway"
  | "atlantic_coastal_medina"
  | "blue_city"
  | "atlantic_beach"
  | "white_dove"
  | "spiritual_cultural"
  | "alpine_town";

export type DescriptorId =
  | "historic_medina"
  | "historic"
  | "beachfront"
  | "oceanfront"
  | "waterfront"
  | "marina"
  | "shopping_cafes"
  | "shopping"
  | "business_district"
  | "business"
  | "luxury_living"
  | "luxury"
  | "art_culture"
  | "family_friendly"
  | "family"
  | "nightlife"
  | "university_area"
  | "residential"
  | "mountain_escape"
  | "surf_spot"
  | "surf"
  | "quiet_retreat"
  | "food_dining"
  | "nature"
  | "golf";

export type NearbyType =
  | "DAY_TRIP"
  | "BEACH"
  | "MOUNTAIN"
  | "SURF"
  | "VILLAGE"
  | "NATURE"
  | "DESERT";

export type SeasonTag =
  | "summer"
  | "winter"
  | "spring"
  | "autumn"
  | "year_round";

export type ExploreNeighborhood = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  descriptor: DescriptorId;
  lat: number;
  lng: number;
  featuredOrder?: number;
  searchWeight?: number;
  popularity?: number;
  heroImage?: string;
  osmId?: string;
  wikidataId?: string;
};

export type NearbyDestination = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  type: NearbyType;
  descriptor: DescriptorId;
  lat: number;
  lng: number;
  distanceKm?: number;
  searchWeight?: number;
  popularity?: number;
  bestMonths?: number[];
  seasonTags?: SeasonTag[];
  heroImage?: string;
  osmId?: string;
  wikidataId?: string;
};

export type ExploreCityModule = {
  id: string;
  slug: string;
  city: string;
  countryCode: "MA";
  region: MoroccoRegionId;
  aliases: string[];
  tag: CityTagId;
  timezone: "Africa/Casablanca";
  mapCenter: GeoPoint;
  defaultZoom: number;
  bounds: GeoBounds;
  priority: number;
  searchWeight: number;
  popularity?: number;
  bestMonths?: number[];
  seasonTags?: SeasonTag[];
  neighborhoods: ExploreNeighborhood[];
  nearbyDestinations: NearbyDestination[];
  heroImage?: string;
  osmId: string;
  wikidataId?: string;
};

/** Legacy UI shape used by DestinationContext / ExploreMapCanvas. */
export type ExploreNeighborhoodView = {
  name: string;
  descriptorKey: string;
};

export type ExploreCityContext = {
  slug: string;
  city: string;
  titleKey: string;
  subtitleKey: string;
  taglineKey: string;
  neighborhoods: ExploreNeighborhoodView[];
  mapCenter?: GeoPoint;
  bounds?: GeoBounds;
  defaultZoom?: number;
  tag: CityTagId;
};
