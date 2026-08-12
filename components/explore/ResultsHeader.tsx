"use client";

import React from "react";
import { Columns2, List, Map as MapIcon } from "lucide-react";
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
  /** Compact mobile row — phones hide layout toggle (bottom-nav FAB); md+ shows it for tablet. */
  compact?: boolean;
  verifiedOnly?: boolean;
  /** Destination name owned by ResultsHeader (desktop split / list pane). */
  destinationTitle?: string;
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
  compact,
  verifiedOnly,
  destinationTitle,
}: ResultsHeaderProps) {
  const countLabel =
    isLoading && matchCount === 0
      ? t("common.loading")
      : isRevalidating
        ? (
          <>
            <span
              className="inline-block h-3 w-3 rounded-full border-2 border-nexa-primary border-t-transparent animate-spin"
              aria-hidden
            />
            {compact && verifiedOnly
              ? tf("listings.verifiedStaysCount", { count: matchCount })
              : tf("listings.showingMatches", { count: matchCount })}
          </>
        )
        : matchCount === 0
          ? t("listings.noStaysFound")
          : compact && verifiedOnly
            ? tf("listings.verifiedStaysCount", { count: matchCount })
            : tf("listings.showingMatches", { count: matchCount });

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 w-full",
        compact && "flex-nowrap gap-2",
        className,
      )}
    >
      {leading}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-nexa-ink-4 min-w-0 flex-1">
        {destinationTitle ? (
          <span className="font-display text-base sm:text-lg font-semibold text-nexa-ink truncate max-w-full">
            {destinationTitle}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2 whitespace-nowrap truncate">
          {countLabel}
        </span>
        {!compact && !isLoading && matchCount > 0 && (
          <span className="hidden sm:inline whitespace-nowrap">{updatedLabel}</span>
        )}
      </div>
      <label className="inline-flex items-center gap-2 text-[0.8rem] text-nexa-ink-3 shrink-0">
        {!compact && (
          <span className="hidden sm:inline whitespace-nowrap">
            {t("listings.sortBy")}
          </span>
        )}
        <NexaSelect
          variant="pill"
          value={sort}
          aria-label={t("listings.sortBy")}
          onChange={onSortChange}
          options={sortOptions}
        />
      </label>
      {/*
        Compact (phone feed / tablet): List|Map only — map via bottom-nav FAB on phones.
        Desktop (non-compact): List|Split|Map with selected state matching canonical layout.
      */}
      <div
        className={cn(
          "rounded-full border border-nexa-line bg-nexa-bg-2 p-0.5 shrink-0 ms-auto",
          compact ? "hidden md:inline-flex" : "inline-flex",
        )}
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
        {!compact && (
          <button
            type="button"
            onClick={() => onLayoutChange("split")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              layout === "split"
                ? "bg-white text-nexa-ink shadow-sm"
                : "text-nexa-ink-4 hover:text-nexa-ink",
            )}
          >
            <Columns2 className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{t("listings.splitView")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onLayoutChange("map")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            layout === "map"
              ? "bg-white text-nexa-ink shadow-sm"
              : "text-nexa-ink-4 hover:text-nexa-ink",
          )}
        >
          <MapIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("listings.mapView")}</span>
        </button>
      </div>
    </div>
  );
}
