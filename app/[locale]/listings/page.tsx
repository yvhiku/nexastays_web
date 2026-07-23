"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  exploreCardToListing,
  exploreListings,
  exploreMapPins,
  mapPinToListing,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { ListingCard } from "@/components/listing/ListingCard";
import { ListingCardSkeleton, ListingGridSkeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_SEARCH_BAR_VALUE,
  SearchBar,
  pushRecentSearch,
  searchBarValueFromSearchParams,
  type SearchBarValue,
  exploreFiltersToSearchParams,
  mergeExploreFilters,
  exploreFiltersToApiParams,
  searchParamsToExploreFilters,
  type ExploreFilters,
} from "@/components/search";
import { findDestinationById, findDestinationByCity } from "@/lib/search-destinations";
import { type ExploreMapHandle } from "@/components/explore/ExploreMap";
import { DestinationContext } from "@/components/explore/DestinationContext";
import { ExploreCollections } from "@/components/explore/ExploreCollections";
import { QuickFilters } from "@/components/explore/QuickFilters";
import { ResultsHeader } from "@/components/explore/ResultsHeader";
import { TrustStrip } from "@/components/explore/TrustStrip";
import type { MapBounds, SearchListingsParams, StaysListing } from "@/lib/stays-types";
import {
  getCollectionById,
  type ExploreCollection,
} from "@/lib/explore-collections";
import { getCityContextByCity, slugifyNeighborhood } from "@/lib/explore-city-context";
import { resolveExploreLayout, showsExploreMap, type ExploreLayout } from "@/lib/explore-layout";
import { ListingsMapPanel } from "@/components/explore/ListingsMapPanel";
import { parseNeighborhood } from "@/lib/listing-location";
import { trackEvent } from "@/lib/analytics";
import { getExploreMode } from "@/lib/explore-mode";
import { recordExploreRecentSearch } from "@/lib/explore-recent-searches";
import { ExploreFeed } from "@/components/explore/feed/ExploreFeed";

const LISTING_TYPES = ["APARTMENT", "HOTEL", "RIAD", "VILLA", "HOSTEL"] as const;
const SORT_OPTIONS = ["newest", "rating", "price_desc", "price_asc"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tf, locale, localePath } = useLanguage();
  const [listings, setListings] = useState<StaysListing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPins, setMapPins] = useState<StaysListing[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreLock = useRef(false);
  const exploreMapRef = useRef<ExploreMapHandle | null>(null);
  const lastMapBoundsRef = useRef<MapBounds | null>(null);

  const exploreFilters = useMemo(
    () => searchParamsToExploreFilters(searchParams),
    [searchParams],
  );

  const city = exploreFilters.city ?? "";
  const checkin = exploreFilters.checkin_date ?? "";
  const checkout = exploreFilters.checkout_date ?? "";
  const guests = exploreFilters.guests;
  const verifiedOnly = exploreFilters.verified_walkthrough_only ?? false;
  const instantOnly = exploreFilters.instant_booking_only ?? false;
  const listingTypeRaw = exploreFilters.listing_type?.toUpperCase() ?? "all";
  const selectedType = LISTING_TYPES.includes(
    listingTypeRaw as (typeof LISTING_TYPES)[number],
  )
    ? listingTypeRaw
    : "all";
  const sortParam = (exploreFilters.sort ?? "newest").toLowerCase();
  const selectedSort: SortOption = SORT_OPTIONS.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "newest";
  const neighborhoodParam = exploreFilters.neighborhood ?? "";
  const hasSeoFilters = Boolean(
    exploreFilters.amenity ||
      exploreFilters.pets_allowed ||
      exploreFilters.luxury_only ||
      exploreFilters.family_friendly ||
      (exploreFilters.near_lat != null && exploreFilters.near_lng != null),
  );
  const collectionId = searchParams.get("collection");
  const activeCollection = getCollectionById(collectionId);
  const rawLayoutParam = searchParams.get("layout");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const effectiveLayout = resolveExploreLayout(rawLayoutParam, viewport);
  const exploreMode = useMemo(
    () => getExploreMode(exploreFilters),
    [exploreFilters],
  );

  const urlSearch = useMemo(
    () => searchBarValueFromSearchParams(searchParams),
    [searchParams],
  );
  const [searchDraft, setSearchDraft] = useState<SearchBarValue>(urlSearch);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const update = () => setViewport(mq.matches ? "desktop" : "mobile");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const exploreParams = useMemo((): SearchListingsParams => {
    return {
      ...exploreFiltersToApiParams(exploreFilters),
      limit: 24,
      sort: selectedSort,
    };
  }, [exploreFilters, selectedSort]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setIsLoading(true);
    setNextCursor(null);
    setHasMore(false);

    exploreListings(exploreParams)
      .then((envelope) => {
        if (cancelled) return;
        setListings(envelope.items.map(exploreCardToListing));
        setNextCursor(envelope.pagination.next_cursor);
        setHasMore(envelope.pagination.has_more);
        setFetchedAt(Date.now());
      })
      .catch((err) => {
        if (!cancelled) {
          setError(formatUserError(err) || t("listings.failedLoad"));
          setListings([]);
          setNextCursor(null);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [exploreParams, t]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMoreLock.current || isLoadingMore) return;
    loadingMoreLock.current = true;
    setIsLoadingMore(true);
    try {
      const envelope = await exploreListings({
        ...exploreParams,
        cursor: nextCursor,
      });
      setListings((prev) => {
        const seen = new Set(prev.map((l) => l.id));
        const appended = envelope.items
          .map(exploreCardToListing)
          .filter((l) => !seen.has(l.id));
        return [...prev, ...appended];
      });
      setNextCursor(envelope.pagination.next_cursor);
      setHasMore(envelope.pagination.has_more);
    } catch (err) {
      setError(formatUserError(err) || t("listings.failedLoad"));
    } finally {
      setIsLoadingMore(false);
      loadingMoreLock.current = false;
    }
  }, [exploreParams, hasMore, nextCursor, isLoadingMore, t]);

  useEffect(() => {
    if (effectiveLayout === "map" || !hasMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [effectiveLayout, hasMore, loadMore, listings.length]);

  const handleMapBounds = useCallback(
    async (bounds: MapBounds) => {
      lastMapBoundsRef.current = bounds;
      setMapLoading(true);
      try {
        const envelope = await exploreMapPins({
          ...exploreParams,
          ...bounds,
        });
        setMapPins(envelope.items.map(mapPinToListing));
      } catch {
        // Keep previous pins on transient map errors.
      } finally {
        setMapLoading(false);
      }
    },
    [exploreParams],
  );

  useEffect(() => {
    setMapPins([]);
  }, [exploreParams]);

  useEffect(() => {
    if (!showsExploreMap(effectiveLayout)) return;
    const bounds = lastMapBoundsRef.current;
    if (!bounds) return;
    void handleMapBounds(bounds);
  }, [exploreParams, effectiveLayout, handleMapBounds]);

  const buildListingsParams = (overrides?: {
    search?: Partial<SearchBarValue>;
    verified?: boolean;
    instant?: boolean;
    listingType?: string;
    sort?: SortOption;
    collection?: string | null;
    neighborhood?: string | null;
    layout?: ExploreLayout | null;
    explore?: Partial<ExploreFilters>;
  }) => {
    const nextSearch: SearchBarValue = {
      ...searchDraft,
      ...overrides?.search,
    };
    if (overrides?.listingType != null) {
      nextSearch.listingType = overrides.listingType;
    }

    const listingTypeOverride = overrides?.listingType ?? nextSearch.listingType;
    const guestTotal = nextSearch.adults + nextSearch.children;

    const nextNeighborhood =
      overrides && "neighborhood" in overrides
        ? overrides.neighborhood ?? undefined
        : exploreFilters.neighborhood;

    const mergedFilters = mergeExploreFilters(exploreFilters, {
      city: nextSearch.city || undefined,
      checkin_date: nextSearch.checkin || undefined,
      checkout_date: nextSearch.checkout || undefined,
      guests: guestTotal > 0 ? guestTotal : undefined,
      listing_type:
        listingTypeOverride && listingTypeOverride !== "all"
          ? listingTypeOverride
          : undefined,
      verified_walkthrough_only: overrides?.verified ?? verifiedOnly,
      instant_booking_only: overrides?.instant ?? instantOnly,
      sort: overrides?.sort ?? selectedSort,
      neighborhood: nextNeighborhood,
      ...overrides?.explore,
    });

    const params = exploreFiltersToSearchParams(mergedFilters);

    if (nextSearch.adults > 0) params.set("adults", String(nextSearch.adults));
    if (nextSearch.children > 0) params.set("children", String(nextSearch.children));
    if (nextSearch.infants > 0) params.set("infants", String(nextSearch.infants));
    if (nextSearch.pets > 0) params.set("pets", String(nextSearch.pets));

    const nextCollection =
      overrides && "collection" in overrides ? overrides.collection : collectionId;
    if (nextCollection) params.set("collection", nextCollection);

    if (overrides && "layout" in overrides) {
      if (overrides.layout === "map" || overrides.layout === "list") {
        params.set("layout", overrides.layout);
      }
    } else if (rawLayoutParam === "map" || rawLayoutParam === "list") {
      params.set("layout", rawLayoutParam);
    }

    return params;
  };

  const navigateWithParams = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(localePath(`/listings${qs ? `?${qs}` : ""}`));
  };

  const setVerifiedOnly = (next: boolean) => {
    navigateWithParams(buildListingsParams({ verified: next }));
  };

  const setInstantOnly = (next: boolean) => {
    navigateWithParams(buildListingsParams({ instant: next }));
  };

  const setPropertyType = (type: string) => {
    const next = { ...searchDraft, listingType: type };
    setSearchDraft(next);
    navigateWithParams(
      buildListingsParams({
        search: next,
        listingType: type,
      }),
    );
  };

  const commitSearch = (next: SearchBarValue) => {
    setSearchDraft(next);
    const dest = findDestinationById(next.destinationId);
    if (dest) {
      pushRecentSearch({
        destinationId: dest.id,
        label: dest.label,
        city: dest.resolveCity,
      });
    }
    const label = dest?.label || next.city.trim() || t("searchBar.searchMorocco");
    recordExploreRecentSearch(next, label);
    trackEvent("search_submitted", {
      city: next.city || null,
      checkin: next.checkin || null,
      checkout: next.checkout || null,
      guests: next.adults + next.children || null,
    });
    navigateWithParams(
      buildListingsParams({
        search: next,
        collection: null,
        neighborhood: null,
      }),
    );
  };

  const clearAllFilters = () => {
    setSearchDraft(DEFAULT_SEARCH_BAR_VALUE);
    navigateWithParams(new URLSearchParams());
  };

  const applyCollection = (col: ExploreCollection | null) => {
    if (!col) {
      navigateWithParams(buildListingsParams({ collection: null }));
      return;
    }
    if (activeCollection?.id === col.id) {
      const cleared: SearchBarValue = {
        ...searchDraft,
        city: "",
        destinationId: null,
        adults: 1,
        children: 0,
        listingType: "all",
      };
      setSearchDraft(cleared);
      navigateWithParams(
        buildListingsParams({
          search: cleared,
          collection: null,
          neighborhood: null,
          explore: {
            city: undefined,
            neighborhood: undefined,
            listing_type: undefined,
          },
        }),
      );
      return;
    }
    const f = col.filters;
    const nextCity = f.city ?? "";
    const fromCity = nextCity ? findDestinationByCity(nextCity) : null;
    const next: SearchBarValue = {
      ...searchDraft,
      city: nextCity,
      destinationId: fromCity?.id ?? null,
      adults: f.guests != null && f.guests > 0 ? f.guests : searchDraft.adults,
      children: f.guests != null ? 0 : searchDraft.children,
      listingType: f.listing_type ?? "all",
    };
    setSearchDraft(next);
    navigateWithParams(
      buildListingsParams({
        search: next,
        collection: col.id,
        neighborhood: null,
        explore: {
          city: nextCity || undefined,
          listing_type: f.listing_type,
          verified_walkthrough_only: f.verified_walkthrough_only,
          instant_booking_only: f.instant_booking_only,
          neighborhood: undefined,
          pets_allowed: undefined,
          luxury_only: undefined,
          family_friendly: undefined,
          amenity: undefined,
        },
      }),
    );
  };

  const onSelectNeighborhood = (n: string | null) => {
    if (!city) return;
    navigateWithParams(
      buildListingsParams({
        neighborhood: n ? slugifyNeighborhood(n) : null,
      }),
    );
  };

  const onSelectCity = (c: string) => {
    const dest = findDestinationByCity(c);
    const next: SearchBarValue = {
      ...searchDraft,
      city: c,
      destinationId: dest?.id ?? null,
    };
    setSearchDraft(next);
    navigateWithParams(
      buildListingsParams({
        search: next,
        neighborhood: null,
        collection: null,
      }),
    );
  };

  const onClearCity = () => {
    const next: SearchBarValue = {
      ...searchDraft,
      city: "",
      destinationId: null,
    };
    setSearchDraft(next);
    navigateWithParams(
      buildListingsParams({
        search: next,
        neighborhood: null,
        collection: null,
        explore: {
          city: undefined,
          neighborhood: undefined,
        },
      }),
    );
  };

  const onQuickFilterToggle = (id: string) => {
    if (id === "instant") {
      setInstantOnly(!instantOnly);
      return;
    }
    if (id === "verified") {
      setVerifiedOnly(!verifiedOnly);
      return;
    }
    if (id === "riads") {
      setPropertyType(selectedType === "RIAD" ? "all" : "RIAD");
      return;
    }
    if (id === "apartments") {
      setPropertyType(selectedType === "APARTMENT" ? "all" : "APARTMENT");
      return;
    }
    if (id === "villas") {
      setPropertyType(selectedType === "VILLA" ? "all" : "VILLA");
    }
  };

  const setLayout = (next: ExploreLayout) => {
    if (viewport === "desktop") {
      if (next === "list") {
        navigateWithParams(
          buildListingsParams({
            layout: effectiveLayout === "map" ? null : "list",
          }),
        );
        return;
      }
      if (next === "map") {
        navigateWithParams(buildListingsParams({ layout: "map" }));
        return;
      }
    }
    navigateWithParams(
      buildListingsParams({ layout: next === "map" ? "map" : null }),
    );
  };

  const cityContext = useMemo(
    () => (city ? getCityContextByCity(city) : null),
    [city],
  );

  const resultNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const l of listings) {
      const n = parseNeighborhood(l);
      if (n) set.add(n);
    }
    return Array.from(set);
  }, [listings]);

  const displayListings = listings;
  const mapListings = mapPins.length > 0 ? mapPins : displayListings;

  const mapLabels = useMemo(
    () => ({
      loading: t("common.loading"),
      emptyTitle: t("explore.mapEmptyTitle"),
      emptyMessage: t("explore.mapEmptyMessage"),
      viewStay: t("listings.viewDetails"),
      exploreThisArea: t("explore.exploreThisArea"),
      myLocation: t("explore.myLocation"),
      resetView: t("explore.resetView"),
      zoomOut: t("explore.zoomOut"),
      currentlyExploring: t("explore.currentlyExploring"),
      staysWord: t("explore.staysWord"),
      exploreCity: city
        ? tf("explore.exploreCityCta", { city })
        : t("explore.discoverMorocco"),
    }),
    [t, tf, city],
  );

  const isInitialLoading = isLoading && listings.length === 0;
  const isRevalidating = isLoading && listings.length > 0;

  const updatedLabel =
    fetchedAt != null
      ? t("explore.updatedJustNow")
      : "";

  // Resolve neighborhood display name from curated catalog first
  const neighborhoodDisplay =
    neighborhoodParam &&
    (cityContext?.neighborhoods.find(
      (n) => slugifyNeighborhood(n.name) === slugifyNeighborhood(neighborhoodParam),
    )?.name ??
      resultNeighborhoods.find(
        (n) => slugifyNeighborhood(n) === slugifyNeighborhood(neighborhoodParam),
      ) ??
      neighborhoodParam);

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)] w-full">
          <aside className="hidden xl:block bg-white border-r border-nexa-line p-5 2xl:p-7 px-5 2xl:px-6 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto overflow-x-hidden min-w-0">
            <h3 className="mb-5">{t("listings.filters")}</h3>
            <div className="mb-7">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">
                {t("explore.filterVerified")}
              </h4>
              <button
                type="button"
                aria-pressed={verifiedOnly}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl border text-sm mb-2 transition-all text-left",
                  verifiedOnly
                    ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft"
                    : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary",
                )}
              >
                <span className="min-w-0 leading-snug">
                  🎬 {t("listings.verifiedWalkthroughOnly")}
                </span>
                <span
                  className={cn(
                    "h-4 w-4 rounded border shrink-0",
                    verifiedOnly
                      ? "bg-nexa-primary border-nexa-primary"
                      : "border-nexa-line bg-white",
                  )}
                  aria-hidden
                />
              </button>
              <button
                type="button"
                aria-pressed={instantOnly}
                onClick={() => setInstantOnly(!instantOnly)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl border text-sm mb-2 transition-all text-left",
                  instantOnly
                    ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft"
                    : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary",
                )}
              >
                <span className="min-w-0 leading-snug">
                  ⚡ {t("listings.instantBooking")}
                </span>
                <span
                  className={cn(
                    "h-4 w-4 rounded border shrink-0",
                    instantOnly
                      ? "bg-nexa-primary border-nexa-primary"
                      : "border-nexa-line bg-white",
                  )}
                  aria-hidden
                />
              </button>
            </div>
            <div className="mb-7">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">
                {t("explore.filterProperty")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {["all", ...LISTING_TYPES].map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setPropertyType(type)}
                    className={cn(
                      "py-1.5 px-3.5 rounded-full text-[0.78rem] border transition-all",
                      selectedType === type
                        ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft"
                        : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary",
                    )}
                  >
                    {type === "all"
                      ? t("listings.all")
                      : type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="bg-nexa-bg min-w-0 w-full max-w-full">
            <div className="hidden xl:block bg-white border-b border-nexa-line py-3 sm:py-4 px-4 sm:px-6 lg:px-6 xl:px-8 min-w-0 w-full">
              <div className="flex flex-col gap-3 min-w-0 w-full">
                <SearchBar
                  value={searchDraft}
                  onChange={setSearchDraft}
                  onSearch={commitSearch}
                  t={t}
                  tf={tf}
                  locale={locale}
                  variant="listings"
                />
                <QuickFilters
                  state={{
                    verified: verifiedOnly,
                    instant: instantOnly,
                    listingType: selectedType,
                  }}
                  onToggle={onQuickFilterToggle}
                  t={t}
                />
                <ResultsHeader
                  matchCount={displayListings.length}
                  isLoading={isLoading}
                  isRevalidating={isRevalidating}
                  updatedLabel={updatedLabel}
                  sort={selectedSort}
                  onSortChange={(next) => {
                    const sort = SORT_OPTIONS.includes(next as SortOption)
                      ? (next as SortOption)
                      : "newest";
                    navigateWithParams(buildListingsParams({ sort }));
                  }}
                  layout={effectiveLayout}
                  onLayoutChange={setLayout}
                  sortOptions={[
                    { value: "newest", label: t("listings.sortNewest") },
                    { value: "rating", label: t("listings.sortTopRated") },
                    {
                      value: "price_desc",
                      label: t("listings.sortMostExpensive"),
                    },
                    {
                      value: "price_asc",
                      label: t("listings.sortCheapest"),
                    },
                  ]}
                  t={t}
                  tf={tf}
                  leading={
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen(true)}
                      className="xl:hidden flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full border border-nexa-line hover:border-nexa-primary text-sm font-medium"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {t("listings.filters")}
                    </button>
                  }
                />
              </div>
            </div>

            <div className="xl:hidden">
              {effectiveLayout !== "map" ? (
                <ExploreFeed
                  mode={exploreMode}
                  filters={exploreFilters}
                  searchDraft={searchDraft}
                  listings={displayListings}
                  hasMore={hasMore}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingMore}
                  isRevalidating={isRevalidating}
                  error={
                    error ? (
                      <ErrorAlert
                        error={error}
                        className="mb-4"
                        onDismiss={() => setError(null)}
                      />
                    ) : null
                  }
                  verifiedOnly={verifiedOnly}
                  instantOnly={instantOnly}
                  selectedType={selectedType}
                  selectedSort={selectedSort}
                  layout={effectiveLayout}
                  activeCollection={activeCollection}
                  city={city}
                  checkin={checkin}
                  checkout={checkout}
                  guests={guests}
                  neighborhoodDisplay={neighborhoodDisplay || undefined}
                  neighborhoodCount={cityContext?.neighborhoods.length}
                  updatedLabel={updatedLabel}
                  sortOptions={[
                    { value: "newest", label: t("listings.sortNewest") },
                    { value: "rating", label: t("listings.sortTopRated") },
                    {
                      value: "price_desc",
                      label: t("listings.sortMostExpensive"),
                    },
                    {
                      value: "price_asc",
                      label: t("listings.sortCheapest"),
                    },
                  ]}
                  onSearch={commitSearch}
                  onQuickFilterToggle={onQuickFilterToggle}
                  onSortChange={(next) => {
                    const sort = SORT_OPTIONS.includes(next as SortOption)
                      ? (next as SortOption)
                      : "newest";
                    navigateWithParams(buildListingsParams({ sort }));
                  }}
                  onOpenFilters={() => setMobileFiltersOpen(true)}
                  onSelectCollection={applyCollection}
                  onSelectCity={onSelectCity}
                  onSelectNeighborhood={onSelectNeighborhood}
                  onClearCity={onClearCity}
                  onLoadMore={loadMore}
                  onOpenMap={() => setLayout("map")}
                  loadMoreRef={loadMoreRef}
                  t={t}
                  tf={tf}
                  locale={locale}
                  localePath={localePath}
                />
              ) : null}
            </div>

            <div className="hidden xl:block p-4 sm:p-5 md:p-6 xl:p-7 xl:px-8 min-w-0 w-full max-w-full">
              {effectiveLayout !== "map" && (
                <>
                  <DestinationContext
                    city={city}
                    neighborhood={neighborhoodDisplay || undefined}
                    neighborhoodCount={cityContext?.neighborhoods.length}
                    matchCount={
                      isInitialLoading ? undefined : displayListings.length
                    }
                    onSelectNeighborhood={onSelectNeighborhood}
                    onSelectCity={onSelectCity}
                    onClearCity={onClearCity}
                    t={t}
                    tf={tf}
                  />
                  <ExploreCollections
                    activeId={activeCollection?.id ?? null}
                    onSelect={applyCollection}
                    t={t}
                  />
                </>
              )}

              {error && (
                <ErrorAlert
                  error={error}
                  className="mb-6"
                  onDismiss={() => setError(null)}
                />
              )}

              {isInitialLoading ? (
                <ListingGridSkeleton variant="explore" />
              ) : displayListings.length === 0 ? (
                <div className="text-center py-16 text-nexa-ink-4">
                  <p className="text-lg font-medium mb-2">{t("listings.noStaysFound")}</p>
                  <p className="text-sm">{t("listings.tryAdjusting")}</p>
                  {(verifiedOnly ||
                    instantOnly ||
                    selectedType !== "all" ||
                    Boolean(activeCollection) ||
                    Boolean(neighborhoodParam) ||
                    Boolean(city) ||
                    Boolean(guests) ||
                    Boolean(checkin) ||
                    Boolean(checkout) ||
                    hasSeoFilters) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={clearAllFilters}
                    >
                      {t("listings.clearFilters")}
                    </Button>
                  )}
                </div>
              ) : effectiveLayout === "map" ? (
                <ListingsMapPanel
                  variant="full"
                  showHeader
                  mapRef={exploreMapRef}
                  listings={mapListings}
                  localePath={localePath}
                  checkin={checkin || undefined}
                  checkout={checkout || undefined}
                  guests={guests}
                  city={city}
                  neighborhood={neighborhoodDisplay || undefined}
                  mapLoading={mapLoading}
                  isRevalidating={isRevalidating}
                  onSelectNeighborhood={onSelectNeighborhood}
                  onSelectCity={onSelectCity}
                  onClearCity={onClearCity}
                  onBoundsChange={handleMapBounds}
                  t={t}
                  tf={tf}
                  labels={mapLabels}
                />
              ) : (
                <div
                  className={cn(
                    effectiveLayout === "split" &&
                      "grid grid-cols-[minmax(0,1fr)_minmax(400px,44%)] items-start gap-0",
                  )}
                >
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "grid gap-4 mb-4",
                        effectiveLayout === "split"
                          ? "grid-cols-1 2xl:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                      )}
                      aria-busy={isRevalidating}
                    >
                      {displayListings.map((l) => (
                        <ListingCard
                          key={l.id}
                          listing={l}
                          checkin={checkin || undefined}
                          checkout={checkout || undefined}
                          guests={guests}
                          city={city || undefined}
                          verifiedWalkthroughOnly={verifiedOnly}
                          instantBookingOnly={instantOnly}
                          listingType={selectedType}
                          t={t}
                          tf={tf}
                          localePath={localePath}
                        />
                      ))}
                    </div>
                    <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />
                    {isLoadingMore && (
                      <div
                        className={cn(
                          "mb-6 grid grid-cols-1 gap-4",
                          effectiveLayout === "split"
                            ? "2xl:grid-cols-2"
                            : "sm:grid-cols-2 lg:grid-cols-3",
                        )}
                        aria-busy="true"
                      >
                        <ListingCardSkeleton />
                        <div className={effectiveLayout === "split" ? "hidden 2xl:block" : "hidden sm:block"}>
                          <ListingCardSkeleton />
                        </div>
                        {effectiveLayout !== "split" && (
                          <div className="hidden lg:block">
                            <ListingCardSkeleton />
                          </div>
                        )}
                      </div>
                    )}
                    {hasMore && (
                      <div className="mb-9 flex justify-center">
                        <button
                          type="button"
                          onClick={() => void loadMore()}
                          disabled={isLoadingMore}
                          className="rounded-xl border border-nexa-line bg-white px-5 py-2.5 text-sm font-semibold text-nexa-ink-2 transition hover:border-nexa-primary/40 hover:text-nexa-primary disabled:opacity-50"
                        >
                          {t("listings.loadMore")}
                        </button>
                      </div>
                    )}
                    {!hasMore && displayListings.length > 0 && (
                      <p className="mb-9 text-center text-sm text-nexa-ink-4">
                        {t("listings.endOfResults")}
                      </p>
                    )}
                  </div>
                  {effectiveLayout === "split" && (
                    <aside className="sticky top-[72px] h-[calc(100vh-72px)] border-l border-nexa-line bg-white">
                      <ListingsMapPanel
                        variant="panel"
                        showHeader={false}
                        mapRef={exploreMapRef}
                        listings={mapListings}
                        localePath={localePath}
                        checkin={checkin || undefined}
                        checkout={checkout || undefined}
                        guests={guests}
                        city={city}
                        neighborhood={neighborhoodDisplay || undefined}
                        mapLoading={mapLoading}
                        isRevalidating={isRevalidating}
                        onSelectNeighborhood={onSelectNeighborhood}
                        onSelectCity={onSelectCity}
                        onClearCity={onClearCity}
                        onBoundsChange={handleMapBounds}
                        t={t}
                        tf={tf}
                        labels={mapLabels}
                        className="h-full mb-0"
                      />
                    </aside>
                  )}
                </div>
              )}

              <TrustStrip localePath={localePath} t={t} className="mt-2" />
            </div>

            <div className="xl:hidden p-4 sm:p-5 min-w-0 w-full max-w-full">
              {effectiveLayout === "map" && (
                <>
                  {error && (
                    <ErrorAlert
                      error={error}
                      className="mb-6"
                      onDismiss={() => setError(null)}
                    />
                  )}
                  <ListingsMapPanel
                    variant="full"
                    showHeader
                    mapRef={exploreMapRef}
                    listings={mapListings}
                    localePath={localePath}
                    checkin={checkin || undefined}
                    checkout={checkout || undefined}
                    guests={guests}
                    city={city}
                    neighborhood={neighborhoodDisplay || undefined}
                    mapLoading={mapLoading}
                    isRevalidating={isRevalidating}
                    onSelectNeighborhood={onSelectNeighborhood}
                    onSelectCity={onSelectCity}
                    onClearCity={onClearCity}
                    onBoundsChange={handleMapBounds}
                    t={t}
                    tf={tf}
                    labels={mapLabels}
                  />
                  <button
                    type="button"
                    onClick={() => setLayout("list")}
                    className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-nexa-ink px-4 py-3 text-sm font-semibold text-white shadow-lg"
                  >
                    {t("listings.listView")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile filters drawer */}
        <div
          className={cn(
            "fixed inset-0 z-50 xl:hidden transition-opacity duration-300",
            mobileFiltersOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-hidden={!mobileFiltersOpen}
        >
          <div className="absolute inset-0 bg-nexa-ink/40" onClick={() => setMobileFiltersOpen(false)} />
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl p-6 overflow-y-auto transition-transform duration-300 shadow-xl",
              mobileFiltersOpen ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{t("listings.filters")}</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex items-center justify-center w-11 h-11 min-h-[44px] rounded-lg hover:bg-nexa-bg-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-7">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">{t("explore.filterVerified")}</h4>
              <button
                type="button"
                aria-pressed={verifiedOnly}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={cn(
                  "flex w-full items-center justify-between py-3 px-4 rounded-xl border text-sm mb-2 transition-all min-h-[44px] text-left",
                  verifiedOnly ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3",
                )}
              >
                <span>🎬 {t("listings.verifiedWalkthroughOnly")}</span>
                <span
                  className={cn(
                    "h-4 w-4 rounded border shrink-0",
                    verifiedOnly ? "bg-nexa-primary border-nexa-primary" : "border-nexa-line bg-white",
                  )}
                  aria-hidden
                />
              </button>
              <button
                type="button"
                aria-pressed={instantOnly}
                onClick={() => setInstantOnly(!instantOnly)}
                className={cn(
                  "flex w-full items-center justify-between py-3 px-4 rounded-xl border text-sm transition-all min-h-[44px] text-left",
                  instantOnly ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3",
                )}
              >
                <span>⚡ {t("listings.instantBooking")}</span>
                <span
                  className={cn(
                    "h-4 w-4 rounded border shrink-0",
                    instantOnly ? "bg-nexa-primary border-nexa-primary" : "border-nexa-line bg-white",
                  )}
                  aria-hidden
                />
              </button>
            </div>
            <div className="mb-6">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">{t("explore.filterProperty")}</h4>
              <div className="flex flex-wrap gap-2">
                {["all", ...LISTING_TYPES].map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      setPropertyType(type);
                      setMobileFiltersOpen(false);
                    }}
                    className={cn(
                      "py-2.5 px-4 rounded-full text-sm border transition-all min-h-[44px] flex items-center",
                      selectedType === type ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3",
                    )}
                  >
                    {type === "all" ? t("listings.all") : type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setMobileFiltersOpen(false)} className="w-full">
              {t("listings.applyFilters")}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
