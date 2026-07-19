"use client";

import React from "react";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexaSelect } from "@/components/ui/NexaSelect";
import type { ExploreLayout } from "@/lib/explore-layout";

export type ResultsHeaderProps = {
  matchCount: number;
  isLoading: boolean;
  isRevalidating: boolean;
  updatedLabel: string;
  sort: string;
  onSortChange: (sort: string) => void;
  layout: ExploreLayout;
  onLayoutChange: (layout: ExploreLayout) => void;
  sortOptions: { value: string; label: string }[];
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
  leading?: React.ReactNode;
};

export function ResultsHeader({
  matchCount,
  isLoading,
  isRevalidating,
  updatedLabel,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  sortOptions,
  t,
  tf,
  className,
  leading,
}: ResultsHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 w-full",
        className,
      )}
    >
      {leading}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-nexa-ink-4 min-w-0">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          {isLoading && matchCount === 0
            ? t("common.loading")
            : isRevalidating
              ? (
                <>
                  <span
                    className="inline-block h-3 w-3 rounded-full border-2 border-nexa-primary border-t-transparent animate-spin"
                    aria-hidden
                  />
                  {tf("listings.showingMatches", { count: matchCount })}
                </>
              )
              : matchCount === 0
                ? t("listings.noStaysFound")
                : tf("listings.showingMatches", { count: matchCount })}
        </span>
        {!isLoading && matchCount > 0 && (
          <span className="hidden sm:inline whitespace-nowrap">{updatedLabel}</span>
        )}
      </div>
      <label className="inline-flex items-center gap-2 text-[0.8rem] text-nexa-ink-3">
        <span className="hidden sm:inline whitespace-nowrap">
          {t("listings.sortBy")}
        </span>
        <NexaSelect
          variant="pill"
          value={sort}
          aria-label={t("listings.sortBy")}
          onChange={onSortChange}
          options={sortOptions}
        />
      </label>
      <div
        className="inline-flex rounded-full border border-nexa-line bg-nexa-bg-2 p-0.5 shrink-0 ms-auto"
        role="group"
        aria-label={t("listings.viewMode")}
      >
        <button
          type="button"
          onClick={() => onLayoutChange("list")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            layout === "list"
              ? "bg-white text-nexa-ink shadow-sm"
              : "text-nexa-ink-4 hover:text-nexa-ink",
          )}
        >
          <List className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("listings.listView")}</span>
        </button>
        <button
          type="button"
          onClick={() => onLayoutChange("map")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            layout === "map" || layout === "split"
              ? "bg-white text-nexa-ink shadow-sm"
              : "text-nexa-ink-4 hover:text-nexa-ink",
          )}
        >
          <MapIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("listings.mapView")}</span>
        </button>
        {/* split reserved — not shown in Phase 1 */}
      </div>
    </div>
  );
}
