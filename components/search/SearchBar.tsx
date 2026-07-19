"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchDestination } from "@/lib/search-destinations";
import { findDestinationById } from "@/lib/search-destinations";
import { DestinationPanel, stayTypeLabel } from "./DestinationField";
import { DateRangePanel } from "./DateRangeField";
import { GuestsPanel } from "./GuestsField";
import { formatDateRangeSummary, formatGuestSummary } from "./guest-summary";
import type { SearchBarValue, SearchOpenField } from "./types";

export type SearchBarProps = {
  value: SearchBarValue;
  onChange: (next: SearchBarValue) => void;
  onSearch: (value: SearchBarValue) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  locale?: string;
  className?: string;
  /** Compact variant for listings chrome */
  variant?: "home" | "listings";
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  t,
  tf,
  locale = "en",
  className,
  variant = "home",
}: SearchBarProps) {
  const [open, setOpen] = useState<SearchOpenField>(null);
  const [destQuery, setDestQuery] = useState("");
  const rootRef = useRef<HTMLFormElement>(null);
  const panelId = useId();

  const patch = (partial: Partial<SearchBarValue>) =>
    onChange({ ...value, ...partial });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const dest = findDestinationById(value.destinationId);
  const wherePrimary =
    dest?.label || value.city || t("searchBar.searchDestinations");
  const whereHasValue = Boolean(dest?.label || value.city);
  const stayChip =
    value.listingType && value.listingType !== "all"
      ? stayTypeLabel(value.listingType, t)
      : null;

  const whenLabel = formatDateRangeSummary(
    value.checkin,
    value.checkout,
    locale,
    t("searchBar.addDates"),
  );
  const whenHasValue = Boolean(value.checkin || value.checkout);

  const guestsLabel = formatGuestSummary(value, tf);
  const guestsHasValue =
    value.adults + value.children + value.infants + value.pets > 0;

  const isReady =
    whereHasValue || whenHasValue || value.adults + value.children > 1;

  const onSelectDestination = (d: SearchDestination) => {
    patch({
      destinationId: d.id,
      city: d.resolveCity,
    });
    setDestQuery("");
    setOpen("when");
  };

  const fieldBtn = (
    field: Exclude<SearchOpenField, null>,
    label: string,
    summary: string,
    hasValue: boolean,
    extra?: React.ReactNode,
  ) => (
    <button
      type="button"
      aria-expanded={open === field}
      aria-controls={open === field ? panelId : undefined}
      onClick={() => setOpen((o) => (o === field ? null : field))}
      className={cn(
        "relative text-left px-4 sm:px-5 py-3.5 min-h-[64px] transition-all duration-200 rounded-2xl sm:rounded-full",
        open === field
          ? "bg-white shadow-nexa-md z-10 scale-[1.02]"
          : "hover:bg-nexa-bg-2/80",
      )}
    >
      <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-0.5">
        {label}
      </span>
      <span
        className={cn(
          "block text-sm font-medium truncate",
          hasValue ? "text-nexa-ink" : "text-nexa-ink-4",
        )}
      >
        {summary}
      </span>
      {extra}
    </button>
  );

  return (
    <form
      ref={rootRef}
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(null);
        onSearch(value);
      }}
      className={cn(
        "relative bg-white border border-nexa-line shadow-nexa-lg",
        variant === "home"
          ? "rounded-2xl sm:rounded-full p-2 max-w-[920px] mx-auto"
          : "rounded-2xl p-2 w-full",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 min-w-0",
          open && "sm:divide-x-0",
        )}
      >
        <div className="flex-1 min-w-0 sm:basis-[32%] relative">
          {fieldBtn(
            "where",
            t("searchBar.where"),
            wherePrimary,
            whereHasValue,
            stayChip ? (
              <span className="mt-1 inline-flex rounded-full bg-nexa-primary-soft text-nexa-primary text-[0.65rem] font-semibold px-2 py-0.5">
                {stayChip}
              </span>
            ) : null,
          )}
          {whereHasValue && (
            <button
              type="button"
              aria-label={t("searchBar.clearWhere")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                patch({ city: "", destinationId: null });
                setDestQuery("");
              }}
              className="absolute end-2 top-1/2 -translate-y-1/2 z-20 rounded-full p-1.5 text-nexa-ink-4 hover:bg-nexa-bg-2 hover:text-nexa-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
          {open === "where" && (
            <div
              id={panelId}
              role="dialog"
              aria-label={t("searchBar.where")}
              className="absolute left-0 right-0 sm:left-0 sm:right-auto top-full mt-2 z-50 rounded-2xl border border-nexa-line bg-white shadow-nexa-lg"
            >
              <DestinationPanel
                query={destQuery}
                onQueryChange={setDestQuery}
                listingType={value.listingType}
                onSelectDestination={onSelectDestination}
                onListingTypeChange={(listingType) => patch({ listingType })}
                t={t}
              />
            </div>
          )}
        </div>

        <div className="hidden sm:block w-px self-stretch bg-nexa-line my-3" aria-hidden />

        <div className="flex-1 min-w-0 sm:basis-[28%] relative">
          {fieldBtn("when", t("searchBar.when"), whenLabel, whenHasValue)}
          {open === "when" && (
            <div
              id={panelId}
              role="dialog"
              aria-label={t("searchBar.when")}
              className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 z-50 w-[min(100vw-1.5rem,640px)] rounded-2xl border border-nexa-line bg-white shadow-nexa-lg"
            >
              <DateRangePanel
                checkin={value.checkin}
                checkout={value.checkout}
                onChange={({ checkin, checkout }) =>
                  patch({ checkin, checkout })
                }
                onComplete={() => setOpen("guests")}
                min={todayISO()}
                locale={locale}
                clearLabel={t("home.search.clearDate")}
              />
            </div>
          )}
        </div>

        <div className="hidden sm:block w-px self-stretch bg-nexa-line my-3" aria-hidden />

        <div className="flex-1 min-w-0 sm:basis-[28%] relative">
          {fieldBtn("guests", t("searchBar.who"), guestsLabel, guestsHasValue)}
          {open === "guests" && (
            <div
              id={panelId}
              role="dialog"
              aria-label={t("searchBar.who")}
              className="absolute right-0 left-0 sm:left-auto top-full mt-2 z-50 rounded-2xl border border-nexa-line bg-white shadow-nexa-lg"
            >
              <GuestsPanel
                value={value}
                onChange={patch}
                t={t}
              />
            </div>
          )}
        </div>

        <div className="p-1 sm:ps-2 flex items-center">
          <button
            type="submit"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full bg-nexa-primary text-white font-semibold shadow-[0_4px_16px_rgba(232,80,122,.32)] transition-all duration-200",
              "hover:bg-nexa-primary-dark w-full sm:w-auto min-h-[48px]",
              isReady ? "px-6 sm:px-7 scale-105" : "px-5",
            )}
          >
            <Search className="h-4 w-4" aria-hidden />
            <span>{t("searchBar.search")}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
