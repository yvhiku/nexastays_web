"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shield, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestsPanel } from "@/components/search";
import type { StaysListing } from "@/lib/stays-types";
import { addDaysToDateString } from "@/lib/booking-dates";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney, formatNightlyPrice } from "@/lib/format-money";

interface ListingBookingCardProps {
  listing: StaysListing;
  checkin: string;
  checkout: string;
  guests: number;
  maxGuests: number;
  nights: number;
  price: number;
  guestFee: number;
  guestFeeLabel: string;
  total: number;
  currency: string;
  booking: boolean;
  /** Distinct loading copy during booking → payment intent. */
  bookingPhase?: "idle" | "creating" | "preparing_payment";
  bookingError: string | null;
  isAuthenticated: boolean;
  userProfile: { kyc_status: string } | null;
  localePath: (p: string) => string;
  /** Occupied nights (YYYY-MM-DD) that cannot be booked. */
  blockedNights?: string[];
  /** Increment to begin the guided check-in → check-out date flow. */
  openCalendarRequest?: number;
  onCheckinChange: (v: string) => void;
  onCheckoutChange: (v: string) => void;
  onGuestsChange: (v: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ListingBookingCard({
  listing,
  checkin,
  checkout,
  guests,
  maxGuests,
  nights,
  price,
  guestFee,
  guestFeeLabel,
  total,
  currency,
  booking,
  bookingPhase = "idle",
  bookingError,
  isAuthenticated,
  userProfile,
  localePath,
  blockedNights = [],
  openCalendarRequest = 0,
  onCheckinChange,
  onCheckoutChange,
  onGuestsChange,
  onSubmit,
}: ListingBookingCardProps) {
  const { t, locale } = useLanguage();
  const [adults, setAdults] = useState(() => Math.max(1, guests));
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [activeCalendar, setActiveCalendar] = useState<"checkin" | "checkout" | null>(null);

  useEffect(() => {
    if (openCalendarRequest > 0) setActiveCalendar("checkin");
  }, [openCalendarRequest]);

  useEffect(() => {
    const occ = adults + childrenCount;
    if (occ >= 1 && occ !== guests) onGuestsChange(occ);
  }, [adults, childrenCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (guests !== adults + childrenCount) {
      setAdults(Math.max(1, guests));
      setChildrenCount(0);
    }
  }, [guests]); // eslint-disable-line react-hooks/exhaustive-deps

  const kycBlocked =
    isAuthenticated &&
    userProfile &&
    userProfile.kyc_status !== "APPROVED" &&
    userProfile.kyc_status !== "VERIFIED";

  const today = todayISO();
  const checkoutMin = checkin ? addDaysToDateString(checkin, 1) : today;
  const occupancyOver = adults + childrenCount > maxGuests;
  const petsPolicy = listing.rules?.pets_policy;

  const checkoutDisabledDates = useMemo(() => {
    if (!checkin || blockedNights.length === 0) return blockedNights;
    const blocked = new Set(blockedNights);
    const invalid: string[] = [];
    // Look ahead ~18 months of candidate checkout days
    let cursor = addDaysToDateString(checkin, 1);
    const horizon = addDaysToDateString(today, 540);
    let crossedBlockedNight = false;
    while (cursor <= horizon) {
      const lastNight = addDaysToDateString(cursor, -1);
      if (lastNight >= checkin && blocked.has(lastNight)) {
        crossedBlockedNight = true;
      }
      if (crossedBlockedNight) invalid.push(cursor);
      cursor = addDaysToDateString(cursor, 1);
    }
    return invalid;
  }, [checkin, blockedNights, today]);

  const handleCheckinSelection = (value: string) => {
    onCheckinChange(value);
    if (!value) {
      setActiveCalendar(null);
      return;
    }
    // The check-in picker closes during the same event. Transfer control on the
    // next frame so focus and portal positioning settle before checkout opens.
    requestAnimationFrame(() => setActiveCalendar("checkout"));
  };

  const handleCheckoutSelection = (value: string) => {
    onCheckoutChange(value);
    setActiveCalendar(null);
  };

  const handleGuidedSubmit = (event: React.FormEvent) => {
    if (!checkin) {
      event.preventDefault();
      setActiveCalendar("checkin");
      return;
    }
    if (!checkout || nights < 1) {
      event.preventDefault();
      setActiveCalendar("checkout");
      return;
    }
    onSubmit(event);
  };

  return (
    <div className="min-w-0 lg:sticky lg:top-[100px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-nexa-card border border-white p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-nexa-ink">
            {formatNightlyPrice(price, currency, locale, ` ${t("listingDetail.perNight")}`)}
          </span>
        </div>
        {listing.instant_booking && (
          <span className="flex items-center gap-1 text-xs font-semibold text-nexa-primary">
            <Star className="w-3.5 h-3.5 fill-nexa-primary" />
            Instant
          </span>
        )}
      </div>

      <form onSubmit={handleGuidedSubmit} className="space-y-4">
        <div className="grid grid-cols-1 border border-nexa-line rounded-xl min-w-0">
          <div className="relative p-3 border-b border-nexa-line rounded-t-xl min-w-0">
            <label className="block text-[10px] font-bold uppercase text-nexa-ink-4 tracking-wide mb-1">
              {t("listingDetail.checkIn")}
            </label>
            <DatePicker
              value={checkin}
              onChange={handleCheckinSelection}
              open={activeCalendar === "checkin"}
              onOpenChange={(open) => setActiveCalendar(open ? "checkin" : null)}
              min={today}
              disabledDates={blockedNights}
              placeholder={t("home.search.addDates")}
              clearLabel={t("home.search.clearDate")}
              todayLabel={t("home.search.today")}
              locale={locale}
              panelMaxWidth={320}
            />
          </div>
          <div className="relative p-3 border-b border-nexa-line min-w-0">
            <label className="block text-[10px] font-bold uppercase text-nexa-ink-4 tracking-wide mb-1">
              {t("listingDetail.checkOut")}
            </label>
            <DatePicker
              value={checkout}
              onChange={handleCheckoutSelection}
              open={activeCalendar === "checkout"}
              onOpenChange={(open) => setActiveCalendar(open ? "checkout" : null)}
              min={checkoutMin}
              disabledDates={checkoutDisabledDates}
              placeholder={t("home.search.addDates")}
              clearLabel={t("home.search.clearDate")}
              todayLabel={t("home.search.today")}
              locale={locale}
              panelMaxWidth={320}
            />
          </div>
          <div className="relative p-3 rounded-b-xl min-w-0">
            <GuestsPanel
              value={{
                adults,
                children: childrenCount,
                infants,
                pets,
              }}
              maxOccupancy={maxGuests}
              embedded
              onChange={(patch) => {
                if (patch.adults != null) setAdults(patch.adults);
                if (patch.children != null) setChildrenCount(patch.children);
                if (patch.infants != null) setInfants(patch.infants);
                if (patch.pets != null) setPets(patch.pets);
              }}
              t={t}
              footer={
                pets > 0 && petsPolicy === "NO" ? (
                  <p className="mt-2 text-xs text-amber-800">
                    {t("searchBar.petsNotAllowed")}
                  </p>
                ) : null
              }
            />
          </div>
        </div>

        {blockedNights.length > 0 && (
          <p className="text-xs text-nexa-ink-4">
            {t("listingDetail.blockedDatesHint")}
          </p>
        )}

        {kycBlocked && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            {t("listingDetail.kycPending")}{" "}
            <Link href={localePath("/registration")} className="text-nexa-primary font-medium hover:underline">
              {t("listingDetail.completeVerification")}
            </Link>
          </div>
        )}

        {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}

        <Button
          type="submit"
          className="w-full justify-center py-6 text-base font-bold rounded-xl bg-nexa-primary-soft text-nexa-primary-dark hover:bg-nexa-primary/20 border-0 shadow-md"
          disabled={
            booking ||
            !!kycBlocked ||
            occupancyOver
          }
        >
          {booking
            ? bookingPhase === "preparing_payment"
              ? t("listingDetail.preparingPayment")
              : t("listingDetail.creatingBooking")
            : isAuthenticated
              ? t("listingDetail.requestToBook")
              : t("listingDetail.signInToBook")}
        </Button>

        <p className="text-center text-xs text-nexa-ink-4">{t("listingDetail.notChargedYet")}</p>

        {nights > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-nexa-ink-3">
                {nights === 1
                  ? t("listingDetail.nightLine")
                      .replace("{price}", formatMoney(price, currency, locale))
                      .replace("{nights}", String(nights))
                  : t("listingDetail.nightsLine")
                      .replace("{price}", formatMoney(price, currency, locale))
                      .replace("{nights}", String(nights))}
              </span>
              <span>{formatMoney(price * nights, currency, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nexa-ink-3">
                {t("listingDetail.guestFee").replace("{percent}", guestFeeLabel)}
              </span>
              <span>{formatMoney(guestFee, currency, locale)}</span>
            </div>
            <hr className="border-nexa-line/60" />
            <div className="flex justify-between font-bold text-base pt-1">
              <span>{t("listingDetail.total")}</span>
              <span>{formatMoney(total, currency, locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-nexa-line/60 space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-green-700 shrink-0" />
            <span className="text-xs font-medium text-nexa-ink-3">{t("listingDetail.securePayment")}</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-green-700 shrink-0" />
            <span className="text-xs font-medium text-nexa-ink-3">{t("listingDetail.freeCancellation")}</span>
          </div>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-nexa-ink-4 text-center">
            {t("listingDetail.identityRequired")}
          </p>
        )}
      </form>
    </div>
  );
}
