"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestSelect } from "@/components/ui/GuestSelect";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { searchListings, getListingMediaUrl } from "@/lib/stays-api";
import { ListingCard } from "@/components/listing/ListingCard";
import type { StaysListing } from "@/lib/stays-types";
import { MOROCCO_CITIES } from "@/lib/moroccan-cities";
import { VIBE_CARDS } from "@/lib/vibe-assets";
import { addDaysToDateString } from "@/lib/booking-dates";
import { sanitizeCityInput, sanitizeDateInput, sanitizeGuestCount } from "@/lib/input-sanitize";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const filterFieldClass =
  "relative flex-1 min-w-0 h-11 rounded-xl border border-nexa-line bg-white px-3 flex items-center focus-within:border-nexa-primary focus-within:ring-2 focus-within:ring-nexa-primary/20 transition-colors";

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tf, locale, localePath } = useLanguage();
  const [listings, setListings] = useState<StaysListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const city = sanitizeCityInput(searchParams.get("city") || "");
  const checkin = sanitizeDateInput(searchParams.get("checkin_date") || "");
  const checkout = sanitizeDateInput(searchParams.get("checkout_date") || "");
  const guests = sanitizeGuestCount(searchParams.get("guests") || "");
  const verifiedOnly = searchParams.get("verified_walkthrough_only") === "true";
  const instantOnly = searchParams.get("instant_booking_only") === "true";
  const listingTypeParam = (searchParams.get("listing_type") || "all").toUpperCase();
  const selectedType = ["APARTMENT", "HOTEL", "RIAD", "VILLA", "HOSTEL"].includes(listingTypeParam)
    ? listingTypeParam
    : "all";

  const [draftCity, setDraftCity] = useState(city);
  const [draftCheckin, setDraftCheckin] = useState(checkin);
  const [draftCheckout, setDraftCheckout] = useState(checkout);
  const [draftGuests, setDraftGuests] = useState(guests ? String(guests) : "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setDraftCity(city);
    setDraftCheckin(checkin);
    setDraftCheckout(checkout);
    setDraftGuests(guests ? String(guests) : "");
  }, [city, checkin, checkout, guests]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setIsLoading(true);

    searchListings({
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
    })
      .then((data) => {
        if (!cancelled) setListings(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("listings.failedLoad"));
          setListings([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [city, checkin, checkout, guests, verifiedOnly, instantOnly, selectedType, t]);

  const buildListingsParams = (overrides?: {
    city?: string;
    checkin?: string;
    checkout?: string;
    guests?: string;
    verified?: boolean;
    instant?: boolean;
    listingType?: string;
  }) => {
    const params = new URLSearchParams();
    const nextCity = overrides?.city ?? draftCity;
    const nextCheckin = overrides?.checkin ?? draftCheckin;
    const nextCheckout = overrides?.checkout ?? draftCheckout;
    const nextGuests = overrides?.guests ?? draftGuests;
    const v = overrides?.verified ?? verifiedOnly;
    const i = overrides?.instant ?? instantOnly;
    const type = overrides?.listingType ?? selectedType;
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
    return params;
  };

  const navigateWithParams = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(localePath(`/listings${qs ? `?${qs}` : ""}`));
  };

  const refreshWithFilters = (newVerified?: boolean, newInstant?: boolean) => {
    navigateWithParams(
      buildListingsParams({
        verified: newVerified ?? verifiedOnly,
        instant: newInstant ?? instantOnly,
      }),
    );
  };

  const setPropertyType = (type: string) => {
    navigateWithParams(buildListingsParams({ listingType: type }));
  };

  const applySearch = () => {
    navigateWithParams(buildListingsParams());
  };

  const applyVibe = (filters: {
    city?: string;
    listing_type?: string;
    guests?: number;
  }) => {
    const params = buildListingsParams({
      ...(filters.city != null ? { city: filters.city } : {}),
      ...(filters.guests != null ? { guests: String(filters.guests) } : {}),
      ...(filters.listing_type != null ? { listingType: filters.listing_type } : {}),
    });
    if (filters.city != null) setDraftCity(filters.city);
    if (filters.guests != null) setDraftGuests(String(filters.guests));
    navigateWithParams(params);
  };

  const minCheckin = todayISO();
  const displayListings = listings;

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
          <aside className="hidden lg:block bg-white border-r border-nexa-line p-7 px-6 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto">
            <h3 className="mb-5">{t("listings.filters")}</h3>
            <div className="mb-7">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">
                {t("listings.trust")}
              </h4>
              <label
                className={cn(
                  "flex items-center justify-between py-2.5 px-3.5 rounded-xl border cursor-pointer text-sm mb-2 transition-all",
                  verifiedOnly ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3"
                )}
                onClick={() => refreshWithFilters(!verifiedOnly, undefined)}
              >
                <span>🎬 {t("listings.verifiedWalkthroughOnly")}</span>
                <input type="checkbox" checked={verifiedOnly} readOnly className="accent-nexa-primary" />
              </label>
              <label
                className={cn(
                  "flex items-center justify-between py-2.5 px-3.5 rounded-xl border cursor-pointer text-sm mb-2 transition-all",
                  instantOnly ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary"
                )}
                onClick={() => refreshWithFilters(undefined, !instantOnly)}
              >
                <span>⚡ {t("listings.instantBooking")}</span>
                <input type="checkbox" checked={instantOnly} readOnly className="accent-nexa-primary" />
              </label>
            </div>
            <div className="mb-7">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">
                {t("listings.propertyType")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {["all", "APARTMENT", "HOTEL", "RIAD", "VILLA", "HOSTEL"].map((type) => (
                  <span
                    key={type}
                    onClick={() => setPropertyType(type)}
                    className={cn(
                      "py-1.5 px-3.5 rounded-full text-[0.78rem] border cursor-pointer transition-all",
                      selectedType === type ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary"
                    )}
                  >
                    {type === "all" ? t("listings.all") : type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="bg-nexa-bg">
            <div className="bg-white border-b border-nexa-line py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex flex-wrap items-center gap-3 sm:gap-4 sticky top-[72px] z-20 overflow-visible">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applySearch();
                }}
                className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
              >
                <div className={cn(filterFieldClass, "bg-nexa-bg-2 sm:max-w-[180px]")}>
                  <GuestSelect
                    value={draftCity}
                    onChange={setDraftCity}
                    aria-label={t("listings.anyCity")}
                    className="w-full"
                    options={[
                      { value: "", label: t("listings.anyCity") },
                      ...MOROCCO_CITIES.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </div>
                <div className={filterFieldClass}>
                  <DatePicker
                    value={draftCheckin}
                    onChange={(next) => {
                      setDraftCheckin(next);
                      if (draftCheckout && next && draftCheckout <= next) {
                        setDraftCheckout("");
                      }
                    }}
                    placeholder={t("home.search.addDates")}
                    clearLabel={t("home.search.clearDate")}
                    todayLabel={t("home.search.today")}
                    locale={locale}
                    min={minCheckin}
                    className="w-full"
                  />
                </div>
                <div className={filterFieldClass}>
                  <DatePicker
                    value={draftCheckout}
                    onChange={setDraftCheckout}
                    placeholder={t("home.search.addDates")}
                    clearLabel={t("home.search.clearDate")}
                    todayLabel={t("home.search.today")}
                    locale={locale}
                    min={draftCheckin ? addDaysToDateString(draftCheckin, 1) : minCheckin}
                    className="w-full"
                  />
                </div>
                <div className={cn(filterFieldClass, "sm:max-w-[140px]")}>
                  <GuestSelect
                    value={draftGuests}
                    onChange={setDraftGuests}
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
                <button type="submit" className="px-4 py-2.5 min-h-[44px] rounded-xl bg-nexa-primary text-white font-semibold text-sm hover:bg-nexa-primary-dark shrink-0 shadow-[0_4px_16px_rgba(232,80,122,.32)]">
                  🔍 {t("common.search")}
                </button>
              </form>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full border border-nexa-line hover:border-nexa-primary text-sm font-medium"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t("listings.filters")}
              </button>
              <span className="text-[0.8rem] text-nexa-ink-4 whitespace-nowrap hidden sm:inline">
                {isLoading ? t("common.loading") : tf("listings.staysFound", { count: displayListings.length })}
              </span>
            </div>

            <div className="p-4 sm:p-6 md:p-7 md:px-8">
              <div className="bg-gradient-to-br from-nexa-ink to-nexa-ink-2 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-9 md:px-10 mb-6 sm:mb-7">
                <h1 className="text-white text-xl sm:text-2xl font-semibold mb-2">
                  {t("listings.staysTitle")}
                </h1>
                <p className="text-white/65 text-sm max-w-[500px] mb-4">
                  {t("listings.staysSubtitle")}
                </p>
              </div>

              <div className="mb-2">
                <h3 className="text-base font-semibold mb-1">{t("listings.chooseVibe")}</h3>
                <p className="text-[0.8rem] text-nexa-ink-4">
                  {t("listings.tapVibe")}
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 mb-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {VIBE_CARDS.map((vibe) => (
                  <button
                    type="button"
                    key={vibe.id}
                    onClick={() => applyVibe(vibe.filters)}
                    className="group shrink-0 w-[148px] h-[88px] rounded-xl overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform shadow-sm text-left"
                  >
                    <Image
                      src={vibe.src}
                      alt={t(vibe.labelKey)}
                      fill
                      sizes="148px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: vibe.objectPosition }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-nexa-ink/75 via-nexa-ink/25 to-transparent"
                      aria-hidden
                    />
                    <span className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[0.78rem] font-bold leading-tight drop-shadow-md">
                      {t(vibe.labelKey)}
                    </span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[320px] bg-gray-200 rounded-[22px] animate-pulse" />
                  ))}
                </div>
              ) : displayListings.length === 0 ? (
                <div className="text-center py-16 text-nexa-ink-4">
                  <p className="text-lg font-medium mb-2">{t("listings.noStaysFound")}</p>
                  <p className="text-sm">{t("listings.tryAdjusting")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-9">
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
              )}

              <div className="bg-nexa-primary-soft/80 border border-nexa-primary/15 rounded-2xl p-5 sm:p-6 md:p-7">
                <p className="font-sans text-sm sm:text-[0.9375rem] leading-relaxed text-nexa-ink-2 max-w-3xl mb-5">
                  {t("listings.noSurprises")}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-3">
                  {["listings.verifiedWalkthrough", "listings.verifiedIdentity", "listings.accurateLocation", "listings.clearCheckinContact"].map((key) => (
                    <li key={key} className="flex items-start gap-2.5 font-sans text-sm text-nexa-ink-2">
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
            "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
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
              <label
                className={cn(
                  "flex items-center justify-between py-3 px-4 rounded-xl border cursor-pointer text-sm mb-2 transition-all min-h-[44px]",
                  verifiedOnly ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3"
                )}
                onClick={() => refreshWithFilters(!verifiedOnly, undefined)}
              >
                <span>🎬 {t("listings.verifiedWalkthroughOnly")}</span>
                <input type="checkbox" checked={verifiedOnly} readOnly className="accent-nexa-primary" />
              </label>
              <label
                className={cn(
                  "flex items-center justify-between py-3 px-4 rounded-xl border cursor-pointer text-sm transition-all min-h-[44px]",
                  instantOnly ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3"
                )}
                onClick={() => refreshWithFilters(undefined, !instantOnly)}
              >
                <span>⚡ {t("listings.instantBooking")}</span>
                <input type="checkbox" checked={instantOnly} readOnly className="accent-nexa-primary" />
              </label>
            </div>
            <div className="mb-6">
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">{t("listings.propertyType")}</h4>
              <div className="flex flex-wrap gap-2">
                {["all", "APARTMENT", "HOTEL", "RIAD", "VILLA", "HOSTEL"].map((type) => (
                  <span
                    key={type}
                    onClick={() => { setPropertyType(type); setMobileFiltersOpen(false); }}
                    className={cn(
                      "py-2.5 px-4 rounded-full text-sm border cursor-pointer transition-all min-h-[44px] flex items-center",
                      selectedType === type ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft" : "border-nexa-line text-nexa-ink-3"
                    )}
                  >
                    {type === "all" ? t("listings.all") : type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
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
