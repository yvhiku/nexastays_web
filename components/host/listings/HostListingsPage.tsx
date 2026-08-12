"use client";

import React, { useMemo, useState } from "react";
import type { HostListingSummary } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import {
  countHostListingsByFilter,
  filterHostListings,
  sortHostListings,
  type HostListingFilterId,
  type HostListingSortId,
} from "@/lib/host-listings-center";
import { HostListingsHeader } from "@/components/host/listings/HostListingsHeader";
import { HostListingsSummary } from "@/components/host/listings/HostListingsSummary";
import { HostListingsFilters } from "@/components/host/listings/HostListingsFilters";
import { HostListingsGrid } from "@/components/host/listings/HostListingsGrid";
import { HostListingSkeleton } from "@/components/host/listings/HostListingSkeleton";
import { HostListingsEmptyState } from "@/components/host/listings/HostListingsEmptyState";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type TranslateFn = (key: string) => string;

export type HostListingsPageProps = {
  listings: HostListingSummary[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  listingActionId: string | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
};

/**
 * Presentation composer. Domain fetch/pause/resume stay in page.tsx.
 * Filtering/sorting uses lib/host-listings-center.
 */
export function HostListingsPage({
  listings,
  loading,
  error,
  onRetry,
  t,
  locale,
  localePath,
  listingActionId,
  onPause,
  onResume,
}: HostListingsPageProps) {
  const [filter, setFilter] = useState<HostListingFilterId>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<HostListingSortId>("default");

  const counts = useMemo(
    () => countHostListingsByFilter(listings),
    [listings],
  );

  const visible = useMemo(() => {
    const filtered = filterHostListings({ listings, filter, search });
    return sortHostListings(filtered, sort);
  }, [listings, filter, search, sort]);

  const clearFilter = () => {
    setFilter("all");
    setSearch("");
  };

  const countLabel =
    !loading && !error
      ? t("hostPortal.listings.count").replace(
          "{count}",
          String(listings.length),
        )
      : null;

  return (
    <div className="pb-4">
      <HostListingsHeader
        t={t}
        localePath={localePath}
        countLabel={countLabel}
      />

      {loading ? (
        <HostListingSkeleton />
      ) : error && listings.length === 0 ? (
        <HostPortalCard className="border-red-100 bg-red-50 px-4 py-5 text-sm text-red-900">
          <p>{error}</p>
          {onRetry ? (
            <button
              type="button"
              className="mt-2 font-medium text-[color:var(--host-primary)] underline"
              onClick={onRetry}
            >
              {t("hostPortal.listings.retry")}
            </button>
          ) : null}
        </HostPortalCard>
      ) : (
        <>
          {error ? (
            <HostPortalCard className="mb-4 border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
              <p>{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  className="mt-2 font-medium text-[color:var(--host-primary)] underline"
                  onClick={onRetry}
                >
                  {t("hostPortal.listings.retry")}
                </button>
              ) : null}
            </HostPortalCard>
          ) : null}

          {listings.length > 0 ? (
            <>
              <HostListingsSummary
                counts={counts}
                activeFilter={filter}
                onSelect={setFilter}
                t={t}
              />
              <HostListingsFilters
                filter={filter}
                onFilterChange={setFilter}
                search={search}
                onSearchChange={setSearch}
                sort={sort}
                onSortChange={setSort}
                counts={counts}
                t={t}
              />
            </>
          ) : null}

          {listings.length === 0 ? (
            <HostListingsEmptyState
              kind="none"
              t={t}
              localePath={localePath}
            />
          ) : visible.length > 0 ? (
            <HostListingsGrid
              listings={visible}
              t={t}
              locale={locale}
              localePath={localePath}
              listingActionId={listingActionId}
              onPause={onPause}
              onResume={onResume}
            />
          ) : (
            <HostListingsEmptyState
              kind="filter"
              onClearFilter={clearFilter}
              t={t}
              localePath={localePath}
            />
          )}
        </>
      )}
    </div>
  );
}
