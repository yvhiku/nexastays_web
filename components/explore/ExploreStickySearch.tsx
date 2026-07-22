"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { findDestinationById } from "@/lib/search-destinations";
import { formatDateRangeSummary, formatGuestSummary } from "@/components/search/guest-summary";
import type { SearchBarValue } from "@/components/search/types";

type Props = {
  value: SearchBarValue;
  locale: string;
  onOpenSheet: () => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
};

const EXPAND_DELAY_MS = 150;
const COMPACT_THRESHOLD = 80;

export function ExploreStickySearch({
  value,
  locale,
  onOpenSheet,
  t,
  tf,
  className,
}: Props) {
  const [compact, setCompact] = useState(false);
  const expandTimer = useRef<number | null>(null);

  const updateCompact = useCallback((next: boolean) => {
    if (expandTimer.current != null) {
      window.clearTimeout(expandTimer.current);
      expandTimer.current = null;
    }
    if (next) {
      setCompact(true);
      return;
    }
    expandTimer.current = window.setTimeout(() => {
      setCompact(false);
      expandTimer.current = null;
    }, EXPAND_DELAY_MS);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      updateCompact(window.scrollY > COMPACT_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (expandTimer.current != null) window.clearTimeout(expandTimer.current);
    };
  }, [updateCompact]);

  const dest = findDestinationById(value.destinationId);
  const whereLabel = dest?.label || value.city || t("searchBar.searchMorocco");
  const whenLabel = formatDateRangeSummary(
    value.checkin,
    value.checkout,
    locale,
    t("searchBar.addDates"),
  );
  const guestsLabel = formatGuestSummary(value, tf);
  const collapsedSummary = [whereLabel, whenLabel, guestsLabel]
    .filter(Boolean)
    .join(" • ");

  return (
    <div
      className={cn(
        "sticky top-[72px] z-40 border-b border-nexa-line bg-white/95 backdrop-blur-sm px-4 transition-[height,padding] duration-[220ms] ease-out",
        compact ? "py-2" : "py-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenSheet}
        aria-label={t("searchBar.searchMorocco")}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-nexa-line bg-white text-left shadow-sm transition-[height,padding] duration-[220ms] hover:border-nexa-primary/40",
          compact ? "min-h-[52px] px-3.5 py-2.5" : "min-h-[120px] flex-col items-stretch px-4 py-3.5",
        )}
      >
        <div className="flex items-center gap-2.5 w-full min-w-0">
          <Search className="h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
          {compact ? (
            <span className="truncate text-sm font-medium text-nexa-ink">
              {collapsedSummary}
            </span>
          ) : (
            <span className="text-sm font-semibold text-nexa-ink">
              {t("searchBar.searchMorocco")}
            </span>
          )}
        </div>
        {!compact && (
          <div className="mt-2 grid grid-cols-3 gap-2 text-[0.72rem]">
            <div className="rounded-xl border border-nexa-line/80 px-2.5 py-2 min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-nexa-ink-4">
                {t("searchBar.where")}
              </p>
              <p className="truncate font-medium text-nexa-ink">{whereLabel}</p>
            </div>
            <div className="rounded-xl border border-nexa-line/80 px-2.5 py-2 min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-nexa-ink-4">
                {t("searchBar.when")}
              </p>
              <p className="truncate font-medium text-nexa-ink">{whenLabel}</p>
            </div>
            <div className="rounded-xl border border-nexa-line/80 px-2.5 py-2 min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-nexa-ink-4">
                {t("searchBar.who")}
              </p>
              <p className="truncate font-medium text-nexa-ink">{guestsLabel}</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
