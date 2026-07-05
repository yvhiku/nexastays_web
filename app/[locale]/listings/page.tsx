"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { searchListings, getListingMediaUrl } from "@/lib/stays-api";
import { ListingCard } from "@/components/listing/ListingCard";
import type { StaysListing } from "@/lib/stays-types";
import { MOROCCO_CITIES } from "@/lib/moroccan-cities";
import { VIBE_CARDS } from "@/lib/vibe-assets";

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tf, localePath } = useLanguage();
  const [listings, setListings] = useState<StaysListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(
    searchParams.get("verified_walkthrough_only") === "true"
  );
  const [instantOnly, setInstantOnly] = useState(
    searchParams.get("instant_booking_only") === "true"
  );
  const [selectedType, setSelectedType] = useState<string>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const city = searchParams.get("city") || "";
  const checkin = searchParams.get("checkin_date") || "";
  const checkout = searchParams.get("checkout_date") || "";
  const guests = searchParams.get("guests") ? parseInt(searchParams.get("guests")!, 10) : undefined;

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
  }, [city, checkin, checkout, guests, verifiedOnly, instantOnly, t]);

  const refreshWithFilters = (newVerified?: boolean, newInstant?: boolean) => {
    const v = newVerified ?? verifiedOnly;
    const i = newInstant ?? instantOnly;
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkin) params.set("checkin_date", checkin);
    if (checkout) params.set("checkout_date", checkout);
    if (guests) params.set("guests", String(guests));
    if (v) params.set("verified_walkthrough_only", "true");
    if (i) params.set("instant_booking_only", "true");
    window.history.replaceState({}, "", `/listings?${params.toString()}`);
    setVerifiedOnly(v);
    setInstantOnly(i);
  };

  const searchSummary = [city || t("listings.anywhere"), checkin && checkout ? `${checkin} – ${checkout}` : null, guests ? tf("listings.guestsCount", { count: guests }) : null]
    .filter(Boolean)
    .join(" · ");

  const displayListings = selectedType === "all"
    ? listings
    : listings.filter((l) => l.listing_type.toUpperCase() === selectedType.toUpperCase());

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
                {["all", "APARTMENT", "HOTEL", "RIAD", "VILLA"].map((type) => (
                  <span
                    key={type}
                    onClick={() => setSelectedType(type)}
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
            <div className="bg-white border-b border-nexa-line py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex flex-wrap items-center gap-3 sm:gap-4 sticky top-[72px] z-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const params = new URLSearchParams();
                  const c = (fd.get("city") as string)?.trim();
                  const ci = (fd.get("checkin") as string)?.trim();
                  const co = (fd.get("checkout") as string)?.trim();
                  const g = (fd.get("guests") as string)?.trim();
                  if (c) params.set("city", c);
                  if (ci) params.set("checkin_date", ci);
                  if (co) params.set("checkout_date", co);
                  if (g) params.set("guests", g);
                  if (verifiedOnly) params.set("verified_walkthrough_only", "true");
                  if (instantOnly) params.set("instant_booking_only", "true");
                  router.replace(`/listings?${params.toString()}`);
                }}
                className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
              >
                <select name="city" defaultValue={city} className="flex-1 min-w-0 h-11 rounded-xl border border-nexa-line px-3 py-2 text-sm bg-nexa-bg-2">
                  <option value="">{t("listings.anyCity")}</option>
                  {MOROCCO_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input type="date" name="checkin" defaultValue={checkin} min={new Date().toISOString().split("T")[0]} className="w-full sm:w-auto min-w-0 flex-1 h-11 rounded-xl border border-nexa-line px-3 py-2 text-sm" />
                <input type="date" name="checkout" defaultValue={checkout} min={checkin || new Date().toISOString().split("T")[0]} className="w-full sm:w-auto min-w-0 flex-1 h-11 rounded-xl border border-nexa-line px-3 py-2 text-sm" />
                <select name="guests" defaultValue={guests || ""} className="h-11 rounded-xl border border-nexa-line px-3 py-2 text-sm min-w-[100px]">
                  <option value="">{t("listingDetail.guests")}</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{tf("listings.guestsCount", { count: n })}</option>
                  ))}
                </select>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-nexa-primary text-white font-semibold text-sm hover:bg-nexa-primary-dark shrink-0">
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
                  <div
                    key={vibe.id}
                    className="group shrink-0 w-[148px] h-[88px] rounded-xl overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform shadow-sm"
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
                  </div>
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
                    <ListingCard key={l.id} listing={l} checkin={checkin || undefined} checkout={checkout || undefined} guests={guests} city={city || undefined} t={t} localePath={localePath} />
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
              <h4 className="text-[0.78rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-3.5">Property Type</h4>
              <div className="flex flex-wrap gap-2">
                {["all", "APARTMENT", "HOTEL", "RIAD", "VILLA"].map((type) => (
                  <span
                    key={type}
                    onClick={() => { setSelectedType(type); setMobileFiltersOpen(false); }}
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
