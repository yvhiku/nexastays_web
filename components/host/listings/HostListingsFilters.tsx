"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  HOST_LISTING_FILTER_ORDER,
  type HostListingFilterId,
} from "@/lib/host-listings-center";

type TranslateFn = (key: string) => string;

const FILTER_LABEL_KEYS: Record<HostListingFilterId, string> = {
  all: "hostPortal.listings.filterAll",
  active: "hostPortal.listings.filterActive",
  pending: "hostPortal.listings.filterPending",
  paused: "hostPortal.listings.filterPaused",
  draft: "hostPortal.listings.filterDraft",
  needs_changes: "hostPortal.listings.filterNeedsChanges",
};

type Props = {
  filter: HostListingFilterId;
  onFilterChange: (filter: HostListingFilterId) => void;
  search: string;
  onSearchChange: (q: string) => void;
  counts: Record<HostListingFilterId, number>;
  t: TranslateFn;
};

export function HostListingsFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
  t,
}: Props) {
  const tabs = useMemo(
    () =>
      HOST_LISTING_FILTER_ORDER.filter(
        (id) => id !== "needs_changes" || (counts.needs_changes ?? 0) > 0,
      ),
    [counts.needs_changes],
  );

  return (
    <div className="mb-6 space-y-4">
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label={t("hostPortal.listings.filtersAria")}
      >
        {tabs.map((id) => {
          const active = filter === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilterChange(id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-[color:var(--host-primary)] bg-[color:var(--host-primary)] text-white"
                  : "border-[color:var(--host-border)] bg-[color:var(--host-surface)] text-[color:var(--host-text-secondary)] hover:border-[color:var(--host-primary)]/40",
              )}
            >
              {t(FILTER_LABEL_KEYS[id])}
              <span
                className={cn(
                  "ms-1.5 tabular-nums",
                  active ? "text-white/90" : "text-[color:var(--host-muted)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <label className="block max-w-xl">
        <span className="sr-only">{t("hostPortal.listings.searchLabel")}</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("hostPortal.listings.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[color:var(--host-border)] bg-[color:var(--host-surface)] px-3 text-sm text-[color:var(--host-text)] placeholder:text-[color:var(--host-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--host-primary)]/30"
        />
      </label>
    </div>
  );
}
