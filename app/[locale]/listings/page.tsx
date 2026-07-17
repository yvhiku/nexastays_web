"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestSelect } from "@/components/ui/GuestSelect";
import { ErrorAlert } from "@/components/ui/Alert";
import { SlidersHorizontal, X, List, Map as MapIcon } from "lucide-react";
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
import { ExploreMap } from "@/components/explore/ExploreMap";
import type { MapBounds, SearchListingsParams, StaysListing } from "@/lib/stays-types";
import { MOROCCO_CITIES } from "@/lib/moroccan-cities";
import { VIBE_CARDS, getVibeById, findMatchingVibeId, type VibeId } from "@/lib/vibe-assets";
import { addDaysToDateString } from "@/lib/booking-dates";
import { sanitizeCityInput, sanitizeDateInput, sanitizeGuestCount } from "@/lib/input-sanitize";
import { trackEvent } from "@/lib/analytics";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const filterFieldClass =
  "relative flex-1 min-w-0 h-11 rounded-xl border border-nexa-line bg-white px-3 flex items-center focus-within:border-nexa-primary focus-within:ring-2 focus-within:ring-nexa-primary/20 transition-colors";

const LISTING_TYPES = ["APARTMENT", "HOTEL", "RIAD", "VILLA", "HOSTEL"] as const;

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
  const city = sanitizeCityInput(searchParams.get("city") || "");
  const checkin = sanitizeDateInput(searchParams.get("checkin_date") || "");
  const checkout = sanitizeDateInput(searchParams.get("checkout_date") || "");
  const guests = sanitizeGuestCount(searchParams.get("guests") || "");
  const verifiedOnly = searchParams.get("verified_walkthrough_only") === "true";
  const instantOnly = searchParams.get("instant_booking_only") === "true";
  const listingTypeParam = (searchParams.get("listing_type") || "all").toUpperCase();
  const selectedType = LISTING_TYPES.includes(
    listingTypeParam as (typeof LISTING_TYPES)[number],
  )
    ? listingTypeParam
    : "all";
  const activeVibe: VibeId | null =
    getVibeById(searchParams.get("vibe"))?.id ??
    findMatchingVibeId({ city, guests, selectedType });

  const [draftCity, setDraftCity] = useState(city);
  const [draftCheckin, setDraftCheckin] = useState(checkin);
  const [draftCheckout, setDraftCheckout] = useState(checkout);
  const [draftGuests, setDraftGuests] = useState(guests ? String(guests) : "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    setDraftCity(city);
    setDraftCheckin(checkin);
    setDraftCheckout(checkout);
    setDraftGuests(guests ? String(guests) : "");
  }, [city, checkin, checkout, guests]);

  const exploreParams = useMemo((): SearchListingsParams => {
    return {
      city: city || undefined,
      checkin_date: checkin || undefined,
      checkout_date: checkout || undefined,
      guests,
      verified_walkthrough_only: verifiedOnly || undefined,
      instant_booking_only: instantOnly || undefined,
      listing_type:
        selectedType === "all"
          ? undefined
          : (selectedType as "APARTMENT" | "HOTEL" | "RIAD" | "VILLA" | "HOSTEL"),
      limit: 24,
    };
  }, [city, checkin, checkout, guests, verifiedOnly, instantOnly, selectedType]);

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
    if (viewMode !== "list" || !hasMore) return;
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
  }, [viewMode, hasMore, loadMore, listings.length]);

  const handleMapBounds = useCallback(
    async (bounds: MapBounds) => {
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

  const buildListingsParams = (overrides?: {
    city?: string;
    checkin?: string;
    checkout?: string;
    guests?: string;
    verified?: boolean;
    instant?: boolean;
    listingType?: string;
    vibe?: string | null;
  }) => {
    const params = new URLSearchParams();
    const nextCity = overrides?.city ?? draftCity;
    const nextCheckin = overrides?.checkin ?? draftCheckin;
    const nextCheckout = overrides?.checkout ?? draftCheckout;
    const nextGuests = overrides?.guests ?? draftGuests;
    const v = overrides?.verified ?? verifiedOnly;
    const i = overrides?.instant ?? instantOnly;
    const type = overrides?.listingType ?? selectedType;
    const nextVibe =
      overrides && "vibe" in overrides ? overrides.vibe : activeVibe;
    if (nextCity.trim()) params.set("city", sanitizeCityInput(nextCity));
    if (nextCheckin) {
      const d = sanitizeDateInput(nextCheckin);
      if (d) params.set("checkin_date", d);
    }
    if (nextCheckout) {
      const d = sanitizeDateInput(nextCheckout);
      if (d) params.set("checkout_date", d);
    }
    if (nextGuests) {
      const g = sanitizeGuestCount(nextGuests);
      if (g) params.set("guests", String(g));
    }
    if (v) params.set("verified_walkthrough_only", "true");
    if (i) params.set("instant_booking_only", "true");
    if (type && type !== "all") params.set("listing_type", type);
    if (nextVibe) params.set("vibe", nextVibe);
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
    // Manual type chip overrides the vibe type association.
    navigateWithParams(buildListingsParams({ listingType: type, vibe: null }));
  };

  const updateCity = (next: string) => {
    setDraftCity(next);
    navigateWithParams(buildListingsParams({ city: next, vibe: null }));
  };

  const updateGuests = (next: string) => {
    setDraftGuests(next);
    navigateWithParams(buildListingsParams({ guests: next, vibe: null }));
  };

  const updateCheckin = (next: string) => {
    let nextCheckout = draftCheckout;
    if (nextCheckout && next && nextCheckout <= next) {
      nextCheckout = "";
      setDraftCheckout("");
    }
    setDraftCheckin(next);
    navigateWithParams(
      buildListingsParams({ checkin: next, checkout: nextCheckout }),
    );
  };

  const updateCheckout = (next: string) => {
    setDraftCheckout(next);
    navigateWithParams(buildListingsParams({ checkout: next }));
  };

  const applySearch = () => {
    trackEvent("search_submitted", {
      city: draftCity || null,
      checkin: draftCheckin || null,
      checkout: draftCheckout || null,
      guests: draftGuests || null,
    });
    navigateWithParams(
      buildListingsParams({
        city: draftCity,
        checkin: draftCheckin,
        checkout: draftCheckout,
        guests: draftGuests,
      }),
    );
  };

  const clearAllFilters = () => {
    setDraftCity("");
    setDraftCheckin("");
    setDraftCheckout("");
    setDraftGuests("");
    navigateWithParams(new URLSearchParams());
  };

  const applyVibe = (vibeId: VibeId) => {
    const vibe = getVibeById(vibeId);
    if (!vibe) return;

    // Tap again to clear the vibe and its filters.
    if (activeVibe === vibeId) {
      setDraftCity("");
      setDraftGuests("");
      navigateWithParams(
        buildListingsParams({
          city: "",
          guests: "",
          listingType: "all",
          vibe: null,
        }),
      );
      return;
    }

    const filters = vibe.filters;
    const nextCity = "city" in filters && filters.city ? filters.city : "";
    const nextGuests =
      "guests" in filters && filters.guests != null
        ? String(filters.guests)
        : "";
    const nextType =
      "listing_type" in filters && filters.listing_type
        ? filters.listing_type
        : "all";

    setDraftCity(nextCity);
    setDraftGuests(nextGuests);
    navigateWithParams(
      buildListingsParams({
        city: nextCity,
        guests: nextGuests,
        listingType: nextType,
        vibe: vibeId,
      }),
    );
  };

  const minCheckin = todayISO();
  const displayListings = listings;

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)] w-full">
          <aside className="hidden xl:block bg-white border-r border-nexa-line p-5 2xl:p-7 px-5 2xl:px-6 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto overflow-x-hidden min-w-0">
            <h3 className="mb-5">{t("listings.filters")}</h3>
            <div className="mb-7">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">
                {t("listings.trust")}
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
                {t("listings.propertyType")}
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
            <div className="bg-white border-b border-nexa-line py-3 sm:py-4 px-4 sm:px-6 lg:px-6 xl:px-8 min-w-0 w-full">
              <div className="flex flex-col gap-3 min-w-0 w-full">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applySearch();
                  }}
                  className="w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto] gap-2"
                >
                  <div className={cn(filterFieldClass, "bg-nexa-bg-2 w-full")}>
                    <GuestSelect
                      value={draftCity}
                      onChange={updateCity}
                      aria-label={t("listings.anyCity")}
                      className="w-full"
                      options={[
                        { value: "", label: t("listings.anyCity") },
                        ...MOROCCO_CITIES.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>
                  <div className={cn(filterFieldClass, "w-full")}>
                    <DatePicker
                      value={draftCheckin}
                      onChange={updateCheckin}
                      placeholder={t("home.search.addDates")}
                      clearLabel={t("home.search.clearDate")}
                      todayLabel={t("home.search.today")}
                      locale={locale}
                      min={minCheckin}
                      className="w-full"
                    />
                  </div>
                  <div className={cn(filterFieldClass, "w-full")}>
                    <DatePicker
                      value={draftCheckout}
                      onChange={updateCheckout}
                      placeholder={t("home.search.addDates")}
                      clearLabel={t("home.search.clearDate")}
                      todayLabel={t("home.search.today")}
                      locale={locale}
                      min={draftCheckin ? addDaysToDateString(draftCheckin, 1) : minCheckin}
                      className="w-full"
                    />
                  </div>
                  <div className={cn(filterFieldClass, "w-full")}>
                    <GuestSelect
                      value={draftGuests}
                      onChange={updateGuests}
                      aria-label={t("listingDetail.guests")}
                      className="w-full"
                      options={[
                        { value: "", label: t("listingDetail.guests") },
                        ...[1, 2, 3, 4, 5, 6].map((n) => ({
                          value: String(n),
                          label: tf("listings.guestsCount", { count: n }),
                        })),
                      ]}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 min-h-[44px] rounded-xl bg-nexa-primary text-white font-semibold text-sm hover:bg-nexa-primary-dark shadow-[0_4px_16px_rgba(232,80,122,.32)] sm:col-span-2 2xl:col-span-1"
                  >
                    🔍 {t("common.search")}
                  </button>
                </form>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="xl:hidden flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full border border-nexa-line hover:border-nexa-primary text-sm font-medium"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("listings.filters")}
                  </button>
                  <span className="text-[0.8rem] text-nexa-ink-4 whitespace-nowrap">
                    {isLoading
                      ? t("common.loading")
                      : displayListings.length === 0
                        ? t("listings.noStaysFound")
                        : tf("listings.showingMatches", {
                            count: displayListings.length,
                          })}
                  </span>
                  <div
                    className="inline-flex rounded-full border border-nexa-line bg-nexa-bg-2 p-0.5 shrink-0 ms-auto"
                    role="group"
                    aria-label={t("listings.viewMode")}
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        viewMode === "list"
                          ? "bg-white text-nexa-ink shadow-sm"
                          : "text-nexa-ink-4 hover:text-nexa-ink",
                      )}
                    >
                      <List className="h-3.5 w-3.5" aria-hidden />
                      <span className="hidden sm:inline">{t("listings.listView")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("map")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        viewMode === "map"
                          ? "bg-white text-nexa-ink shadow-sm"
                          : "text-nexa-ink-4 hover:text-nexa-ink",
                      )}
                    >
                      <MapIcon className="h-3.5 w-3.5" aria-hidden />
                      <span className="hidden sm:inline">{t("listings.mapView")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 xl:p-7 xl:px-8 min-w-0 w-full max-w-full">
              <div className="bg-gradient-to-br from-nexa-ink to-nexa-ink-2 rounded-2xl sm:rounded-[32px] p-5 sm:p-7 md:p-8 mb-6 sm:mb-7 min-w-0">
                <h1 className="text-white text-xl sm:text-2xl font-semibold mb-2">
                  {t("listings.staysTitle")}
                </h1>
                <p className="text-white/65 text-sm max-w-[500px]">
                  {t("listings.staysSubtitle")}
                </p>
              </div>

              <div className="mb-2 min-w-0 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold mb-1">{t("listings.chooseVibe")}</h3>
                  <p className="text-[0.8rem] text-nexa-ink-4">
                    {t("listings.tapVibe")}
                  </p>
                </div>
                {activeVibe && (
                  <button
                    type="button"
                    onClick={() => applyVibe(activeVibe)}
                    className="shrink-0 text-xs font-semibold text-nexa-primary hover:text-nexa-primary-dark"
                  >
                    {t("listings.clearVibe")}
                  </button>
                )}
              </div>
              {/* w-0 min-w-full forces this block to respect the grid column width so cards never spill off-screen */}
              <div className="mb-7 w-0 min-w-full max-w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {VIBE_CARDS.map((vibe) => {
                    const selected = activeVibe === vibe.id;
                    return (
                      <button
                        type="button"
                        key={vibe.id}
                        aria-pressed={selected}
                        onClick={() => applyVibe(vibe.id)}
                        className={cn(
                          "group relative w-full h-[80px] sm:h-[88px] rounded-xl overflow-hidden cursor-pointer shadow-sm text-left transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40",
                          selected &&
                            "ring-2 ring-nexa-primary ring-offset-2 ring-offset-nexa-bg",
                        )}
                      >
                        <Image
                          src={vibe.src}
                          alt={t(vibe.labelKey)}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 160px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          style={{ objectPosition: vibe.objectPosition }}
                        />
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-t from-nexa-ink/75 via-nexa-ink/25 to-transparent",
                            selected && "from-nexa-primary/70 via-nexa-ink/30",
                          )}
                          aria-hidden
                        />
                        <span className="absolute bottom-2 left-2 right-2 text-white text-[0.72rem] sm:text-[0.78rem] font-bold leading-tight drop-shadow-md line-clamp-2">
                          {t(vibe.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <ErrorAlert
                  error={error}
                  className="mb-6"
                  onDismiss={() => setError(null)}
                />
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[320px] bg-gray-200 rounded-[22px] animate-pulse" />
                  ))}
                </div>
              ) : displayListings.length === 0 ? (
                <div className="text-center py-16 text-nexa-ink-4">
                  <p className="text-lg font-medium mb-2">{t("listings.noStaysFound")}</p>
                  <p className="text-sm">{t("listings.tryAdjusting")}</p>
                  {(verifiedOnly ||
                    instantOnly ||
                    selectedType !== "all" ||
                    Boolean(activeVibe) ||
                    Boolean(city) ||
                    Boolean(guests) ||
                    Boolean(checkin) ||
                    Boolean(checkout)) && (
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
              ) : viewMode === "map" ? (
                <div className="mb-9 min-w-0 relative">
                  {mapLoading && (
                    <p className="absolute left-3 top-3 z-[460] rounded-lg bg-white/95 px-2.5 py-1 text-[0.7rem] font-medium text-nexa-ink-4 shadow-sm">
                      {t("common.loading")}
                    </p>
                  )}
                  <ExploreMap
                    listings={mapPins.length > 0 ? mapPins : displayListings}
                    localePath={localePath}
                    checkin={checkin || undefined}
                    checkout={checkout || undefined}
                    guests={guests}
                    preferListingsCenter={Boolean(city)}
                    emptyTitle={t("listings.mapEmptyTitle")}
                    emptyMessage={t("listings.mapEmptyMessage")}
                    viewStayLabel={t("listings.viewStay")}
                    onBoundsChange={handleMapBounds}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                        localePath={localePath}
                      />
                    ))}
                  </div>
                  <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />
                  {isLoadingMore && (
                    <p className="mb-9 text-center text-sm text-nexa-ink-4">
                      {t("common.loading")}
                    </p>
                  )}
                  {!hasMore && displayListings.length > 0 && (
                    <p className="mb-9 text-center text-sm text-nexa-ink-4">
                      {t("listings.endOfResults")}
                    </p>
                  )}
                </>
              )}

              <div className="bg-nexa-primary-soft/80 border border-nexa-primary/15 rounded-2xl p-5 sm:p-6 md:p-7 min-w-0">
                <p className="font-sans text-sm sm:text-[0.9375rem] leading-relaxed text-nexa-ink-2 max-w-3xl mb-5">
                  {t("listings.noSurprises")}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-3">
                  {["listings.verifiedWalkthrough", "listings.verifiedIdentity", "listings.accurateLocation", "listings.clearCheckinContact"].map((key) => (
                    <li key={key} className="flex items-start gap-2.5 font-sans text-sm text-nexa-ink-2 min-w-0">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nexa-primary" aria-hidden />
                      <span className="leading-snug">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">{t("listings.trust")}</h4>
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
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">{t("listings.propertyType")}</h4>
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
