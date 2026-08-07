"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SearchBar, SearchFlow } from "@/components/search";
import {
  formatDateRangeSummary,
  formatGuestSummary,
} from "@/components/search/guest-summary";
import type { SearchBarValue } from "@/components/search/types";
import { findDestinationById } from "@/lib/search-destinations";
import { cn } from "@/lib/utils";

type Props = {
  value: SearchBarValue;
  locale: string;
  onSearch: (value: SearchBarValue) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
};

/**
 * Listings search uses the same interactive search control as the home page.
 * The draft remains local until Search is submitted so opening a field or
 * changing guests does not mutate the listings URL prematurely.
 */
export function ExploreStickySearch({
  value,
  locale,
  onSearch,
  t,
  tf,
  className,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const destination = findDestinationById(draft.destinationId);
  const whereLabel =
    destination?.label || draft.city || t("searchBar.searchDestinations");
  const whenLabel = formatDateRangeSummary(
    draft.checkin,
    draft.checkout,
    locale,
    t("searchBar.addDates"),
  );
  const guestsLabel = formatGuestSummary(draft, tf);

  return (
    <>
      <div
        className={cn(
          "sticky top-[72px] z-layer-sticky border-b border-nexa-line",
          "bg-[linear-gradient(180deg,#fff_0%,#fff8fa_100%)] px-4 py-3 sm:px-6 sm:py-4",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("pwa.navSearch")}
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          className={cn(
            "flex min-h-[64px] w-full items-center gap-3 rounded-full border border-nexa-line bg-white px-4 py-2 text-left shadow-nexa-md sm:hidden",
            "transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.99]",
            "hover:border-nexa-primary/40 focus-visible:border-nexa-primary",
          )}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexa-primary text-white shadow-[0_6px_18px_rgba(232,80,122,.3)]">
            <Search className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-nexa-ink">
              {whereLabel}
            </span>
            <span className="mt-0.5 block truncate text-xs text-nexa-ink-4">
              {whenLabel} · {guestsLabel}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-nexa-primary-soft px-3 py-1.5 text-xs font-semibold text-nexa-primary">
            {t("searchBar.search")}
          </span>
        </button>

        <div className="hidden sm:block">
          <SearchBar
            value={draft}
            onChange={setDraft}
            onSearch={onSearch}
            t={t}
            tf={tf}
            locale={locale}
            variant="home"
            className="mx-auto w-full max-w-none"
          />
        </div>
      </div>

      <SearchFlow
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        initialValue={draft}
        onSearch={(next) => {
          setDraft(next);
          setMobileOpen(false);
          onSearch(next);
        }}
        t={t}
        tf={tf}
        locale={locale}
      />
    </>
  );
}
