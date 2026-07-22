"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildExploreFeed } from "./buildExploreFeed";
import { ExploreFeedRail } from "./ExploreFeedRail";
import { ExploreStickySearch } from "../ExploreStickySearch";
import { ExploreSearchSheet } from "../ExploreSearchSheet";
import { QuickFilters } from "../QuickFilters";
import { ResultsHeader } from "../ResultsHeader";
import { DestinationContext } from "../DestinationContext";
import { ContinueBrowsingRail } from "./rails/ContinueBrowsingRail";
import { CollectionRail } from "./rails/CollectionRail";
import { DestinationRail } from "./rails/DestinationRail";
import { ListingGridRail } from "./rails/ListingGridRail";
import { getExplorePersonalization } from "@/lib/explore-personalization";
import { getCollectionsForContext } from "@/lib/explore-collections";
import { getExploreDestinationCards } from "@/lib/explore-destination-counts";
import type { ExplorePageMode } from "@/lib/explore-mode";
import type { ExploreFilters } from "@/lib/search/explore-filter-utils";
import type { ExploreCollection } from "@/lib/explore-collections";
import type { StaysListing } from "@/lib/stays-types";
import type { SearchBarValue } from "@/components/search/types";
import type { ExploreLayout } from "@/lib/explore-layout";
import type { ListingGridRailData } from "./types";

export type ExploreFeedProps = {
  mode: ExplorePageMode;
  filters: ExploreFilters;
  searchDraft: SearchBarValue;
  listings: StaysListing[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRevalidating: boolean;
  error: React.ReactNode;
  verifiedOnly: boolean;
  instantOnly: boolean;
  selectedType: string;
  selectedSort: string;
  layout: ExploreLayout;
  activeCollection: ExploreCollection | null;
  city: string;
  checkin: string;
  checkout: string;
  guests?: number;
  neighborhoodDisplay?: string;
  neighborhoodCount?: number;
  updatedLabel: string;
  sortOptions: { value: string; label: string }[];
  onSearch: (value: SearchBarValue) => void;
  onQuickFilterToggle: (id: string) => void;
  onSortChange: (sort: string) => void;
  onOpenFilters: () => void;
  onSelectCollection: (col: ExploreCollection | null) => void;
  onSelectCity: (city: string) => void;
  onSelectNeighborhood: (n: string | null) => void;
  onClearCity: () => void;
  onLoadMore: () => void;
  onOpenMap: () => void;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  localePath: (path: string) => string;
};

export function ExploreFeed(props: ExploreFeedProps) {
  const {
    mode,
    filters,
    searchDraft,
    listings,
    hasMore,
    isLoading,
    isLoadingMore,
    isRevalidating,
    error,
    verifiedOnly,
    instantOnly,
    selectedType,
    selectedSort,
    activeCollection,
    city,
    checkin,
    checkout,
    guests,
    neighborhoodDisplay,
    neighborhoodCount,
    updatedLabel,
    sortOptions,
    onSearch,
    onQuickFilterToggle,
    onSortChange,
    onOpenFilters,
    onSelectCollection,
    onSelectCity,
    onSelectNeighborhood,
    onClearCity,
    onLoadMore,
    onOpenMap,
    loadMoreRef,
    t,
    tf,
    locale,
    localePath,
  } = props;

  const [searchOpen, setSearchOpen] = useState(false);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [personalization, setPersonalization] = useState(getExplorePersonalization);
  const momentumTriggered = useRef(false);
  const momentumRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refresh = () => setPersonalization(getExplorePersonalization());
    refresh();
    window.addEventListener("nexa-recently-viewed-changed", refresh);
    return () => window.removeEventListener("nexa-recently-viewed-changed", refresh);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollDepth(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mode !== "feed" || momentumTriggered.current || !hasMore) return;
    const el = momentumRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !momentumTriggered.current) {
          momentumTriggered.current = true;
          onLoadMore();
        }
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [mode, hasMore, onLoadMore, listings.length]);

  const innerHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  const rails = useMemo(
    () =>
      buildExploreFeed(
        {
          mode,
          city: city || undefined,
          filters,
          listings,
          hasMore,
          scrollDepth,
          recentlyViewed: personalization.recentlyViewed,
          lastSearchedCity: personalization.lastSearchedCity,
          collections: getCollectionsForContext(
            (personalization.lastSearchedCity ?? city) || undefined,
          ),
          destinations: getExploreDestinationCards(),
          isMobile: true,
          verifiedOnly,
        },
        innerHeight,
      ),
    [
      mode,
      city,
      filters,
      listings,
      hasMore,
      scrollDepth,
      personalization,
      verifiedOnly,
      innerHeight,
    ],
  );

  const gridCommon = {
    checkin: checkin || undefined,
    checkout: checkout || undefined,
    guests,
    city: city || undefined,
    verifiedOnly,
    instantOnly,
    listingType: selectedType,
    isLoadingMore,
    hasMore,
    isRevalidating,
  };

  const matchCount = listings.length;
  const isInitialLoading = isLoading && listings.length === 0;

  return (
    <div className="min-w-0 w-full">
      <ExploreStickySearch
        value={searchDraft}
        locale={locale}
        onOpenSheet={() => setSearchOpen(true)}
        t={t}
        tf={tf}
      />

      <ExploreSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        value={searchDraft}
        onSearch={(next) => {
          setSearchOpen(false);
          onSearch(next);
        }}
        t={t}
        tf={tf}
        locale={locale}
      />

      <div className="space-y-3 px-4 pb-4 pt-3">
        {rails.map((rail) => {
          if (rail.variant === "stickySearch") return null;

          if (rail.variant === "quickFilters") {
            return (
              <QuickFilters
                key={rail.id}
                state={{
                  verified: verifiedOnly,
                  instant: instantOnly,
                  listingType: selectedType,
                }}
                onToggle={onQuickFilterToggle}
                t={t}
              />
            );
          }

          if (rail.variant === "resultsHeader") {
            return (
              <ResultsHeader
                key={rail.id}
                compact
                matchCount={matchCount}
                isLoading={isLoading}
                isRevalidating={isRevalidating}
                updatedLabel={updatedLabel}
                sort={selectedSort}
                onSortChange={onSortChange}
                layout="list"
                onLayoutChange={() => {}}
                sortOptions={sortOptions}
                t={t}
                tf={tf}
                verifiedOnly={verifiedOnly}
                leading={
                  <button
                    type="button"
                    onClick={onOpenFilters}
                    className="flex items-center gap-2 rounded-full border border-nexa-line px-4 py-2.5 min-h-[44px] text-sm font-medium"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("listings.filters")}
                  </button>
                }
              />
            );
          }

          const wrapped = (node: React.ReactNode) => (
            <ExploreFeedRail
              key={rail.id}
              descriptor={rail}
              scrollDepth={scrollDepth}
            >
              {node}
            </ExploreFeedRail>
          );

          if (rail.variant === "horizontalList") {
            return wrapped(
              <ContinueBrowsingRail
                data={rail.data as { items: typeof personalization.recentlyViewed }}
                localePath={localePath}
                t={t}
              />,
            );
          }

          if (rail.variant === "carousel") {
            const cityCtx = (rail.data.city as string | undefined) ?? city;
            const title = cityCtx
              ? tf("explore.collectionInCity", { city: cityCtx })
              : t(rail.title ?? "explore.collectionsTitle");
            return wrapped(
              <CollectionRail
                data={{
                  collections: rail.data.collections as ExploreCollection[],
                  activeId: activeCollection?.id ?? null,
                }}
                title={title}
                subtitle={rail.subtitle ? t(rail.subtitle) : undefined}
                onSelect={onSelectCollection}
                t={t}
                tf={tf}
              />,
            );
          }

          if (rail.variant === "cards") {
            return wrapped(
              <DestinationRail
                data={rail.data as { cities: ReturnType<typeof getExploreDestinationCards> }}
                title={rail.title ? t(rail.title) : undefined}
                onSelectCity={onSelectCity}
                t={t}
                tf={tf}
              />,
            );
          }

          if (rail.variant === "neighborhoodChips") {
            return (
              <DestinationContext
                key={rail.id}
                chipsOnly
                city={city}
                neighborhood={neighborhoodDisplay}
                neighborhoodCount={neighborhoodCount}
                matchCount={isInitialLoading ? undefined : matchCount}
                onSelectNeighborhood={onSelectNeighborhood}
                onSelectCity={onSelectCity}
                onClearCity={onClearCity}
                t={t}
                tf={tf}
              />
            );
          }

          if (rail.variant === "grid") {
            const isMore = rail.id === "listingsMore";
            const showLoadMore = Boolean(rail.data.showLoadMore);
            return wrapped(
              <>
                {rail.id === "listings" && error}
                {isInitialLoading && rail.id === "listings" ? (
                  <div className="py-8 text-center text-nexa-ink-4">
                    {t("common.loading")}
                  </div>
                ) : (
                  <ListingGridRail
                    data={{
                      ...(rail.data as ListingGridRailData),
                      ...gridCommon,
                      showLoadMore,
                    }}
                    t={t}
                    tf={tf}
                    localePath={localePath}
                    onLoadMore={onLoadMore}
                    loadMoreRef={isMore || showLoadMore ? loadMoreRef : undefined}
                  />
                )}
                {rail.data.momentumSentinel && (
                  <div ref={momentumRef} className="h-1" aria-hidden />
                )}
              </>,
            );
          }

          return null;
        })}
      </div>

      {mode === "searchResults" && (
        <button
          type="button"
          onClick={onOpenMap}
          className={cn(
            "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40",
            "inline-flex items-center gap-2 rounded-full bg-nexa-ink px-4 py-3 text-sm font-semibold text-white shadow-lg",
          )}
        >
          <MapIcon className="h-4 w-4" aria-hidden />
          {t("explore.openMap")}
        </button>
      )}
    </div>
  );
}
