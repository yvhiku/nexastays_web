import type { ExploreFilters } from "@/lib/search/explore-filter-utils";
import type { ExplorePageMode } from "@/lib/explore-mode";
import type { RecentlyViewedItem } from "@/lib/recently-viewed";
import type { ExploreCollection } from "@/lib/explore-collections";
import type { ExploreDestinationCard } from "@/lib/explore-destination-counts";
import type { StaysListing } from "@/lib/stays-types";
import type { SearchBarValue } from "@/components/search/types";

export type ExploreRailVariant =
  | "stickySearch"
  | "quickFilters"
  | "resultsHeader"
  | "grid"
  | "carousel"
  | "cards"
  | "horizontalList"
  | "neighborhoodChips";

export type ExploreRailDescriptor = {
  id: string;
  variant: ExploreRailVariant;
  title?: string;
  subtitle?: string;
  animateOnEnter?: boolean;
  scrollGate?: number;
  data: Record<string, unknown>;
};

export type ExploreFeedContext = {
  mode: ExplorePageMode;
  city?: string;
  filters: ExploreFilters;
  listings: StaysListing[];
  hasMore: boolean;
  scrollDepth: number;
  recentlyViewed: RecentlyViewedItem[];
  lastSearchedCity?: string;
  collections: ExploreCollection[];
  destinations: ExploreDestinationCard[];
  isMobile: boolean;
  verifiedOnly: boolean;
};

export type ListingGridRailData = {
  listings: StaysListing[];
  density?: "default" | "compact";
  checkin?: string;
  checkout?: string;
  guests?: number;
  city?: string;
  verifiedOnly?: boolean;
  instantOnly?: boolean;
  listingType?: string;
  showLoadMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isRevalidating?: boolean;
};

export type StickySearchRailData = {
  value: SearchBarValue;
  onOpenSheet: () => void;
};

export type CollectionRailData = {
  collections: ExploreCollection[];
  activeId: string | null;
  stayCounts?: Record<string, number>;
};

export type DestinationRailData = {
  cities: ExploreDestinationCard[];
};

export type ContinueBrowsingRailData = {
  items: RecentlyViewedItem[];
};
