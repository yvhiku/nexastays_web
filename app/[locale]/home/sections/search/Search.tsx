"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestSelect } from "@/components/ui/GuestSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { addDaysToDateString } from "@/lib/booking-dates";
import { sanitizeCityInput, sanitizeDateInput, sanitizeGuestCount } from "@/lib/input-sanitize";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const SearchSection = () => {
  const { t, locale, localePath } = useLanguage();
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("1");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const city = sanitizeCityInput(destination);
    const checkinDate = sanitizeDateInput(checkin);
    const checkoutDate = sanitizeDateInput(checkout);
    const guestCount = sanitizeGuestCount(guests);
    if (city) params.set("city", city);
    if (checkinDate) params.set("checkin_date", checkinDate);
    if (checkoutDate) params.set("checkout_date", checkoutDate);
    if (guestCount != null) params.set("guests", String(guestCount));
    router.push(localePath(`/listings?${params.toString()}`));
  };

  const goToListings = (extra?: { verified?: boolean }) => {
    const params = new URLSearchParams();
    const city = sanitizeCityInput(destination);
    const checkinDate = sanitizeDateInput(checkin);
    const checkoutDate = sanitizeDateInput(checkout);
    const guestCount = sanitizeGuestCount(guests);
    if (city) params.set("city", city);
    if (checkinDate) params.set("checkin_date", checkinDate);
    if (checkoutDate) params.set("checkout_date", checkoutDate);
    if (guestCount != null) params.set("guests", String(guestCount));
    if (extra?.verified) params.set("verified_walkthrough_only", "true");
    router.push(localePath(`/listings?${params.toString()}`));
  };

  const minCheckin = todayISO();

  return (
    <section className="py-10 sm:py-14 md:py-16 bg-nexa-bg-2 border-b border-nexa-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl sm:rounded-[32px] shadow-nexa-lg border border-nexa-line p-2 flex flex-col sm:flex-row items-stretch sm:items-center max-w-[900px] mx-auto"
        >
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-nexa-line min-w-0">
            <div className="p-3.5 sm:p-3.5 px-5 min-h-[60px] sm:min-h-0 flex flex-col justify-center">
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1">
                {t("home.search.destination")}
              </label>
              <input
                type="text"
                placeholder={t("home.search.destinationPlaceholder")}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full border-none outline-none bg-transparent font-sans text-sm text-nexa-ink"
              />
            </div>
            <div className="relative p-3.5 sm:p-3.5 px-5 min-h-[60px] sm:min-h-0 flex flex-col justify-center">
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1">
                {t("home.search.checkin")}
              </label>
              <DatePicker
                value={checkin}
                onChange={(next) => {
                  setCheckin(next);
                  if (checkout && next && checkout <= next) setCheckout("");
                }}
                placeholder={t("home.search.addDates")}
                clearLabel={t("home.search.clearDate")}
                todayLabel={t("home.search.today")}
                locale={locale}
                min={minCheckin}
              />
            </div>
            <div className="relative p-3.5 sm:p-3.5 px-5 min-h-[60px] sm:min-h-0 flex flex-col justify-center">
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1">
                {t("home.search.checkout")}
              </label>
              <DatePicker
                value={checkout}
                onChange={setCheckout}
                placeholder={t("home.search.addDates")}
                clearLabel={t("home.search.clearDate")}
                todayLabel={t("home.search.today")}
                locale={locale}
                min={checkin ? addDaysToDateString(checkin, 1) : minCheckin}
              />
            </div>
            <div className="relative p-3.5 sm:p-3.5 px-5 min-h-[60px] sm:min-h-0 flex flex-col justify-center">
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1">
                {t("home.search.guests")}
              </label>
              <GuestSelect
                value={guests}
                onChange={setGuests}
                aria-label={t("home.search.guests")}
                options={[
                  { value: "1", label: t("home.search.guest1") },
                  { value: "2", label: t("home.search.guest2") },
                  { value: "3", label: t("home.search.guest3") },
                  { value: "4", label: t("home.search.guest4") },
                  { value: "5", label: t("home.search.guest5Plus") },
                ]}
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="m-1 mx-2 shrink-0 w-full sm:w-auto min-h-[48px]">
            🔍 {t("home.search.search")}
          </Button>
        </motion.form>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-center text-sm text-nexa-ink-4 max-w-[640px] mx-auto mt-4"
        >
          {t("home.search.helperText")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex gap-2.5 flex-wrap justify-center mt-5"
        >
          <button
            type="button"
            onClick={() => goToListings({ verified: true })}
            className="rounded-full py-1.5 px-4 text-sm font-medium border border-nexa-line text-nexa-ink-3 hover:border-nexa-primary hover:text-nexa-primary hover:bg-nexa-primary-soft transition-colors"
          >
            ✓ {t("home.search.verifiedHosts")}
          </button>
          <button
            type="button"
            onClick={() => goToListings()}
            className="rounded-full py-1.5 px-4 text-sm font-medium border border-nexa-line text-nexa-ink-3 hover:border-nexa-primary hover:text-nexa-primary hover:bg-nexa-primary-soft transition-colors"
          >
            📋 {t("home.search.controlledListings")}
          </button>
        </motion.div>
      </div>
    </section>
  );
};
