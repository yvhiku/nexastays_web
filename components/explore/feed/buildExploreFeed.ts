import type { ExploreFeedContext, ExploreRailDescriptor } from "./types";
import { getCollectionsForContext } from "@/lib/explore-collections";
import { getExploreDestinationCards } from "@/lib/explore-destination-counts";

const COLLECTIONS_MIN = 2;
const DESTINATIONS_MIN = 3;
const FIRST_BATCH_SIZE = 12;

function isScrollEligible(
  descriptor: ExploreRailDescriptor,
  scrollDepth: number,
  innerHeight: number,
): boolean {
  if (descriptor.scrollGate == null) return true;
  return scrollDepth >= descriptor.scrollGate * innerHeight;
}

function filterByScrollGate(
  rails: ExploreRailDescriptor[],
  scrollDepth: number,
  innerHeight: number,
): ExploreRailDescriptor[] {
  return rails.filter((rail) => {
    if (rail.scrollGate == null) return true;
    if (!isScrollEligible(rail, scrollDepth, innerHeight)) return false;
    if (rail.variant === "carousel") {
      const cols = rail.data.collections as unknown[] | undefined;
      return (cols?.length ?? 0) >= COLLECTIONS_MIN;
    }
    if (rail.variant === "cards") {
      const cities = rail.data.cities as unknown[] | undefined;
      return (cities?.length ?? 0) >= DESTINATIONS_MIN;
    }
    return true;
  });
}

export function buildSearchResultsFeed(ctx: ExploreFeedContext): ExploreRailDescriptor[] {
  return [
    {
      id: "search",
      variant: "stickySearch",
      animateOnEnter: false,
      data: {},
    },
    {
      id: "quickFilters",
      variant: "quickFilters",
      animateOnEnter: false,
      data: {},
    },
    {
      id: "resultsHeader",
      variant: "resultsHeader",
      animateOnEnter: false,
      data: { compact: true },
    },
    {
      id: "listings",
      variant: "grid",
      animateOnEnter: false,
      data: {
        listings: ctx.listings,
        density: "compact",
        showLoadMore: true,
      },
    },
  ];
}

export function buildDiscoveryFeed(ctx: ExploreFeedContext): ExploreRailDescriptor[] {
  const collections = ctx.collections.length
    ? ctx.collections
    : getCollectionsForContext(ctx.lastSearchedCity ?? ctx.city);

  const collectionTitle = ctx.lastSearchedCity
    ? `explore.collectionInCity`
    : undefined;

  const rails: ExploreRailDescriptor[] = [
    {
      id: "search",
      variant: "stickySearch",
      animateOnEnter: false,
      data: {},
    },
    {
      id: "quickFilters",
      variant: "quickFilters",
      animateOnEnter: false,
      data: {},
    },
    {
      id: "resultsHeader",
      variant: "resultsHeader",
      animateOnEnter: false,
      data: { compact: true },
    },
  ];

  if (ctx.recentlyViewed.length > 0) {
    rails.push({
      id: "continueBrowsing",
      variant: "horizontalList",
      title: "explore.continueBrowsing",
      animateOnEnter: true,
      data: { items: ctx.recentlyViewed },
    });
  }

  const firstBatch = ctx.listings.slice(0, FIRST_BATCH_SIZE);
  const restBatch = ctx.listings.slice(FIRST_BATCH_SIZE);

  rails.push({
    id: "listings",
    variant: "grid",
    animateOnEnter: false,
    data: {
      listings: firstBatch,
      density: "compact",
      showLoadMore: restBatch.length === 0 && ctx.hasMore,
      momentumSentinel: true,
    },
  });

  if (collections.length >= COLLECTIONS_MIN) {
    rails.push({
      id: "collections",
      variant: "carousel",
      title: collectionTitle ?? "explore.collectionsTitle",
      subtitle: "explore.collectionsSubtitle",
      scrollGate: 2,
      animateOnEnter: true,
      data: {
        collections,
        city: ctx.lastSearchedCity ?? ctx.city,
      },
    });
  }

  if (restBatch.length > 0 || ctx.hasMore) {
    rails.push({
      id: "listingsMore",
      variant: "grid",
      animateOnEnter: false,
      data: {
        listings: restBatch,
        density: "compact",
        showLoadMore: true,
      },
    });
  }

  if (!ctx.city) {
    const destinations = ctx.destinations.length
      ? ctx.destinations
      : getExploreDestinationCards();
    if (destinations.length >= DESTINATIONS_MIN) {
      rails.push({
        id: "destinations",
        variant: "cards",
        title: "explore.destinationsTitle",
        scrollGate: 2.5,
        animateOnEnter: true,
        data: { cities: destinations },
      });
    }
  } else {
    rails.push({
      id: "neighborhoodChips",
      variant: "neighborhoodChips",
      animateOnEnter: false,
      data: { city: ctx.city },
    });
  }

  return rails;
}

export function buildExploreFeed(
  ctx: ExploreFeedContext,
  innerHeight = 800,
): ExploreRailDescriptor[] {
  const base =
    ctx.mode === "searchResults"
      ? buildSearchResultsFeed(ctx)
      : buildDiscoveryFeed(ctx);

  return filterByScrollGate(base, ctx.scrollDepth, innerHeight);
}
