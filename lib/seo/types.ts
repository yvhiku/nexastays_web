export type SeoLocale = "en" | "fr" | "ar";

export type SeoPageType =
  | "city"
  | "property_type"
  | "amenity"
  | "city_property_type"
  | "city_amenity"
  | "city_neighborhood"
  | "landmark"
  | "guide"
  | "listing";

export type SeoGuideType = "travel" | "experience" | "seasonal" | "event";

export type SeoRelationType =
  | "near"
  | "similar"
  | "beach_alternative"
  | "luxury_alternative"
  | "day_trip"
  | "surf_alternative";

export type AiSnippetType =
  | "summary"
  | "price"
  | "safety"
  | "transport"
  | "family"
  | "nightlife"
  | "couples"
  | "nomads"
  | "amenities"
  | "seasonality";

export interface AiSnippet {
  type: AiSnippetType;
  content: string;
  confidence: number;
  source: "marketplace" | "editorial" | "ai_draft";
}

export interface GeoBlockDto {
  question: string;
  answer: string;
  statKey?: string | null;
}

export interface DestinationIntelligence {
  listingCount: number;
  verifiedCount: number;
  avgNightlyPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  luxuryCount: number;
  avgRating: number | null;
  reviewCount: number;
  topNeighborhood: string | null;
  bestMonth: string | null;
  topAmenities: string[];
  topPropertyType: string | null;
  verifiedPercent: number | null;
  currency: string;
}

export interface SeoExploreFiltersDto {
  city?: string;
  listing_type?: string;
  amenity?: string;
  neighborhood?: string;
  pets_allowed?: boolean;
  luxury_only?: boolean;
  family_friendly?: boolean;
  near_lat?: number;
  near_lng?: number;
  near_radius_km?: number;
}

export interface SeoDestinationDto {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  regionId: string | null;
  latitude: number | null;
  longitude: number | null;
  heroImageUrl: string | null;
  bestTimeToVisit: string | null;
  nearbyCitySlugs: string[];
  searchCity: string;
  indexable: boolean;
  seoScore: number;
  listingCountCache: number;
}

export interface SeoNeighborhoodDto {
  slug: string;
  name: string;
  searchTerm: string;
}

export interface SeoLandmarkDto {
  slug: string;
  urlSlug: string;
  name: string;
  citySlug: string | null;
  searchCity: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface RelatedDestinationDto {
  slug: string;
  name: string;
  relationType: SeoRelationType;
  href: string;
}

export interface SeoLandingHighlight {
  icon?: string;
  label: string;
  description?: string;
}

export interface SeoLandingKeyValue {
  label: string;
  value: string;
}

export interface SeoLandingSeasonalNote {
  season: string;
  temp_range?: string;
  note: string;
}

export interface SeoLandingPoi {
  name: string;
  href: string;
  description?: string;
  distance_km?: number;
  travel_time?: string;
  cta_label?: string;
  cta_href?: string;
}

export interface SeoLandingComparisonRow {
  label: string;
  left: string;
  right: string;
  left_rating?: number;
  right_rating?: number;
}

export interface SeoLandingComparison {
  vs: string;
  vs_slug?: string;
  vs_href?: string;
  summary?: string;
  rows: SeoLandingComparisonRow[];
}

export interface SeoLandingQuickFacts {
  atmosphere?: string;
  budget?: string;
  nightlife?: number;
  family?: number;
  luxury?: number;
  walkability?: number;
  shopping?: number;
  culture?: number;
  digital_nomads?: number;
  distance_to_center?: string;
  taxi_availability?: string;
}

export interface SeoLandingAtAGlance {
  icon?: string;
  label: string;
  value: string;
}

export interface SeoLandingContentBlocks {
  hero_intro?: string;
  why_stay_here?: string;
  highlights?: SeoLandingHighlight[];
  ideal_for?: string[];
  pros?: string[];
  cons?: string[];
  avoid_if?: string[];
  local_tips?: string[];
  travel_tips?: SeoLandingKeyValue[];
  transport?: SeoLandingKeyValue[];
  seasonal_notes?: SeoLandingSeasonalNote[];
  nearby_poi?: SeoLandingPoi[];
  comparison?: SeoLandingComparison;
  faq?: { question: string; answer: string }[];
  quick_facts?: SeoLandingQuickFacts;
  at_a_glance?: SeoLandingAtAGlance[];
  editorial_facts?: SeoLandingKeyValue[];
}

export interface SeoPagePayload {
  pageType: SeoPageType;
  locale: SeoLocale;
  path: string;
  title: string;
  description: string;
  h1: string;
  canonical: string;
  hreflang: Record<string, string>;
  robots: string;
  destination: SeoDestinationDto | null;
  neighborhood: SeoNeighborhoodDto | null;
  landmark: SeoLandmarkDto | null;
  filterLabel: string | null;
  exploreFilters: SeoExploreFiltersDto;
  intelligence: DestinationIntelligence;
  geoBlocks: GeoBlockDto[];
  faq: GeoBlockDto[];
  aiSnippets: AiSnippet[];
  nearbyDestinations: SeoDestinationDto[];
  relatedDestinations: RelatedDestinationDto[];
  propertyTypeLinks: { slug: string; label: string; href: string }[];
  amenityLinks: { slug: string; label: string; href: string }[];
  neighborhoodLinks: { slug: string; label: string; href: string }[];
  breadcrumbs: { name: string; path: string }[];
  contentBlocks?: SeoLandingContentBlocks;
  cityGuideLink?: { slug: string; href: string; label: string } | null;
  relatedGuides?: SeoGuideSummaryDto[];
  indexable: boolean;
  seoScore: number;
  lastmod: string;
  registrySlug: string;
}

export interface SitemapEntryDto {
  path: string;
  locale: string;
  lastmod: string;
  priority: number;
}

export interface SeoGuideSummaryDto {
  slug: string;
  guideType: SeoGuideType;
  title: string;
  description: string;
  destinationSlug: string | null;
  destinationName: string | null;
  href: string;
  seoScore: number;
}

export interface SeoGuidePagePayload {
  pageType: "guide";
  locale: SeoLocale;
  slug: string;
  guideType: SeoGuideType;
  path: string;
  title: string;
  description: string;
  h1: string;
  canonical: string;
  hreflang: Record<string, string>;
  robots: string;
  bodyHtml: string;
  geoBlocks: GeoBlockDto[];
  destination: SeoDestinationDto | null;
  intelligence: DestinationIntelligence | null;
  relatedGuides: SeoGuideSummaryDto[];
  cityGuideLink: { slug: string; href: string; label: string } | null;
  exploreFilters: SeoExploreFiltersDto;
  breadcrumbs: { name: string; path: string }[];
  indexable: boolean;
  seoScore: number;
  lastmod: string;
}

export interface SeoListingPagePayload {
  pageType: "listing";
  locale: SeoLocale;
  listingId: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  canonical: string;
  hreflang: Record<string, string>;
  robots: string;
  ogImageUrl: string | null;
  listingType: string;
  city: string;
  neighborhood: string | null;
  basePrice: number | null;
  currency: string;
  avgRating: number | null;
  reviewCount: number;
  hasWalkthrough: boolean;
  geoLat: number | null;
  geoLng: number | null;
  breadcrumbs: { name: string; path: string }[];
  indexable: boolean;
  seoScore: number;
  lastmod: string;
}

/** Known single-segment slugs for static generation */
export const SEO_PROPERTY_TYPE_SLUGS = [
  "apartments",
  "hotels",
  "riads",
  "villas",
  "hostels",
] as const;

export const SEO_AMENITY_SLUGS = [
  "pool",
  "pet-friendly",
  "free-parking",
  "wifi",
  "family",
  "luxury",
] as const;
