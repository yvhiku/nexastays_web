"use client";

import React, { useEffect } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { findDestinationById } from "@/lib/search-destinations";
import { formatDateRangeSummary, formatGuestSummary } from "./guest-summary";
import { SearchSummaryRow } from "./SearchSummaryRow";
import { SearchCTA } from "./SearchCTA";
import {
  hasDates,
  hasDestination,
  resolveSearchCtaMode,
  type SearchActiveStep,
} from "./SearchState";
import type { SearchBarValue } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  value: SearchBarValue;
  locale: string;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  flashStep: SearchActiveStep;
  lastFocused: Exclude<SearchActiveStep, null> | null;
  onOpenStep: (step: Exclude<SearchActiveStep, null>) => void;
  onSearchStays: () => void;
  whereRef: React.RefObject<HTMLButtonElement | null>;
  whenRef: React.RefObject<HTMLButtonElement | null>;
  guestsRef: React.RefObject<HTMLButtonElement | null>;
  className?: string;
};

export function SearchSummary({
  value,
  locale,
  t,
  tf,
  flashStep,
  lastFocused,
  onOpenStep,
  onSearchStays,
  whereRef,
  whenRef,
  guestsRef,
  className,
}: Props) {
  const dest = findDestinationById(value.destinationId);
  const whereValue =
    dest?.label || value.city || t("searchBar.whereAreYouGoing");
  const whereDone = hasDestination(value);
  const whenValue = formatDateRangeSummary(
    value.checkin,
    value.checkout,
    locale,
    t("searchBar.addDates"),
  );
  const whenDone = hasDates(value);
  const guestsValue = formatGuestSummary(value, tf);
  const guestsDone = value.adults + value.children + value.infants + value.pets > 0;
  const mode = resolveSearchCtaMode(value);

  useEffect(() => {
    if (!lastFocused) return;
    const map = {
      destination: whereRef,
      dates: whenRef,
      guests: guestsRef,
    } as const;
    const el = map[lastFocused]?.current;
    el?.focus();
  }, [lastFocused, whereRef, whenRef, guestsRef]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SearchSummaryRow
          buttonRef={whereRef}
          icon={MapPin}
          label={t("searchBar.where")}
          value={whereValue}
          hasValue={whereDone}
          completed={whereDone}
          flash={flashStep === "destination"}
          onClick={() => onOpenStep("destination")}
        />
        <SearchSummaryRow
          buttonRef={whenRef}
          icon={CalendarDays}
          label={t("searchBar.when")}
          value={whenValue}
          hasValue={whenDone}
          completed={whenDone}
          flash={flashStep === "dates"}
          onClick={() => onOpenStep("dates")}
        />
        <SearchSummaryRow
          buttonRef={guestsRef}
          icon={Users}
          label={t("searchBar.who")}
          value={guestsValue}
          hasValue={guestsDone}
          completed={guestsDone}
          flash={flashStep === "guests"}
          onClick={() => onOpenStep("guests")}
        />
      </div>
      <SearchCTA
        mode={mode}
        labels={{
          chooseDestination: t("searchBar.chooseDestination"),
          chooseDates: t("searchBar.chooseDates"),
          searchStays: t("searchBar.searchStays"),
        }}
        onChooseDestination={() => onOpenStep("destination")}
        onChooseDates={() => onOpenStep("dates")}
        onSearchStays={onSearchStays}
      />
    </div>
  );
}
