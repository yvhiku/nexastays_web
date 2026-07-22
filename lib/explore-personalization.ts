import { getRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";
import { getExploreRecentSearches } from "@/lib/explore-recent-searches";

export type ExplorePersonalization = {
  recentlyViewed: RecentlyViewedItem[];
  lastSearchedCity?: string;
};

export function getExplorePersonalization(): ExplorePersonalization {
  const recentlyViewed = getRecentlyViewed().slice(0, 6);
  const recentSearches = getExploreRecentSearches();
  const lastSearchedCity = recentSearches[0]?.city;

  return {
    recentlyViewed,
    lastSearchedCity,
  };
}
