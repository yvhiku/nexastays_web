"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTION_MS } from "@/lib/motion";
import { useScrollCompact } from "@/lib/use-scroll-compact";
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

export function ExploreStickySearch({
  value,
  locale,
  onOpenSheet,
  t,
  tf,
  className,
}: Props) {
  const compact = useScrollCompact();

  const dest = findDestinationById(value.destinationId);
  const whereLabel = dest?.label || value.city || t("searchBar.searchMorocco");
  const whenLabel = formatDateRangeSummary(
    value.checkin,
    value.checkout,
    locale,
    t("searchBar.addDates"),
  );
  const guestsLabel = formatGuestSummary(value, tf);
  const collapsedSummary = tf("searchBar.collapsedSummary", {
    where: whereLabel,
    when: whenLabel,
    guests: guestsLabel,
  });

  return (
    <div
      className={cn(
        "sticky top-[72px] z-40 border-b border-nexa-line bg-white/95 backdrop-blur-sm px-4",
        "transition-[height,padding,opacity] ease-out motion-reduce:transition-none",
        compact ? "py-2" : "py-3",
        className,
      )}
      style={{ transitionDuration: `${MOTION_MS.NORMAL}ms` }}
    >
      <button
        type="button"
        onClick={onOpenSheet}
        aria-label={compact ? collapsedSummary : t("searchBar.searchMorocco")}
        aria-expanded={!compact}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-nexa-line bg-white text-left shadow-sm",
          "transition-[height,padding,opacity] ease-out hover:border-nexa-primary/40 motion-reduce:transition-none",
          compact
            ? "min-h-[52px] px-3.5 py-2.5"
            : "min-h-[120px] flex-col items-stretch px-4 py-3.5",
        )}
        style={{ transitionDuration: `${MOTION_MS.NORMAL}ms` }}
      >
        <div className="flex w-full min-w-0 items-center gap-2.5">
          <Search className="h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
          <span
            className={cn(
              "truncate text-sm font-medium text-nexa-ink transition-opacity ease-out motion-reduce:transition-none",
              compact ? "opacity-100" : "font-semibold opacity-100",
            )}
            style={{ transitionDuration: `${MOTION_MS.NORMAL}ms` }}
          >
            {compact ? collapsedSummary : t("searchBar.searchMorocco")}
          </span>
        </div>
        <div
          aria-hidden={compact}
          className={cn(
            "grid w-full grid-cols-3 gap-2 overflow-hidden text-[0.72rem]",
            "transition-[opacity,max-height,margin] ease-out motion-reduce:transition-none",
            compact
              ? "pointer-events-none mt-0 max-h-0 opacity-0"
              : "mt-2 max-h-24 opacity-100",
          )}
          style={{ transitionDuration: `${MOTION_MS.NORMAL}ms` }}
        >
          <div className="min-w-0 rounded-xl border border-nexa-line/80 px-2.5 py-2">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-nexa-ink-4">
              {t("searchBar.where")}
            </p>
            <p className="truncate font-medium text-nexa-ink">{whereLabel}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-nexa-line/80 px-2.5 py-2">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-nexa-ink-4">
              {t("searchBar.when")}
            </p>
            <p className="truncate font-medium text-nexa-ink">{whenLabel}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-nexa-line/80 px-2.5 py-2">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-nexa-ink-4">
              {t("searchBar.who")}
            </p>
            <p className="truncate font-medium text-nexa-ink">{guestsLabel}</p>
          </div>
        </div>
      </button>
    </div>
  );
}
