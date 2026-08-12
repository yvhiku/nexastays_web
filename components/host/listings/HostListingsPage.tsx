"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HostListingSummary } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import {
  getHostListings,
  getHostListingsCounts,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import {
  type HostListingFilterId,
  type HostListingSortId,
  HOST_LISTING_FILTER_ORDER,
} from "@/lib/host-listings-center";
import { HostListingsHeader } from "@/components/host/listings/HostListingsHeader";
import { HostListingsSummary } from "@/components/host/listings/HostListingsSummary";
import { HostListingsFilters } from "@/components/host/listings/HostListingsFilters";
import { HostListingsGrid } from "@/components/host/listings/HostListingsGrid";
import { HostListingSkeleton } from "@/components/host/listings/HostListingSkeleton";
import { HostListingsEmptyState } from "@/components/host/listings/HostListingsEmptyState";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";
import { useHostCursorList } from "@/lib/use-host-cursor-list";

type TranslateFn = (key: string) => string;

export type HostListingsPageProps = {
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  token: string | null;
  listingActionId: string | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  /** Bump to force reload after pause/resume. */
  refreshKey?: number;
};

const PAGE_SIZE = 20;

export function HostListingsPage({
  t,
  locale,
  localePath,
  token,
  listingActionId,
  onPause,
  onResume,
  refreshKey = 0,
}: HostListingsPageProps) {
  const [filter, setFilter] = useState<HostListingFilterId>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<HostListingSortId>("default");
  const [counts, setCounts] = useState<Record<HostListingFilterId, number>>({
    all: 0,
    active: 0,
    pending: 0,
    paused: 0,
    draft: 0,
    needs_changes: 0,
  });

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        filter,
        search: debouncedSearch,
        sort,
        refreshKey,
      }),
    [filter, debouncedSearch, sort, refreshKey],
  );

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      if (!token) {
        return {
          items: [] as HostListingSummary[],
          pagination: { limit: PAGE_SIZE, has_next: false, next_cursor: null },
        };
      }
      try {
        return await getHostListings(token, {
          limit: PAGE_SIZE,
          cursor,
          status: filter,
          search: debouncedSearch || undefined,
          sort,
        });
      } catch (e) {
        throw new Error(
          formatUserError(e) || t("hostPortal.listings.loadFailed"),
        );
      }
    },
    [token, filter, debouncedSearch, sort, t],
  );

  const {
    items: listings,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasNext,
    loadMore,
    reload,
  } = useHostCursorList<HostListingSummary>({
    enabled: Boolean(token),
    queryKey,
    fetchPage,
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getHostListingsCounts(token, {
      search: debouncedSearch || undefined,
    })
      .then((c) => {
        if (cancelled) return;
        const next: Record<HostListingFilterId, number> = {
          all: 0,
          active: 0,
          pending: 0,
          paused: 0,
          draft: 0,
          needs_changes: 0,
        };
        for (const id of HOST_LISTING_FILTER_ORDER) {
          next[id] = c[id] ?? 0;
        }
        setCounts(next);
      })
      .catch(() => {
        /* counts are best-effort */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, debouncedSearch, refreshKey]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNext) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNext, loadMore, listings.length]);

  const clearFilter = () => {
    setFilter("all");
    setSearch("");
  };

  const countLabel =
    !loading && !error
      ? t("hostPortal.listings.count").replace(
          "{count}",
          String(counts.all ?? listings.length),
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
          <button
            type="button"
            className="mt-2 font-medium text-[color:var(--host-primary)] underline"
            onClick={() => void reload()}
          >
            {t("hostPortal.listings.retry")}
          </button>
        </HostPortalCard>
      ) : (
        <>
          {error ? (
            <HostPortalCard className="mb-4 border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
              <p>{error}</p>
              <button
                type="button"
                className="mt-2 font-medium text-[color:var(--host-primary)] underline"
                onClick={() => void reload()}
              >
                {t("hostPortal.listings.retry")}
              </button>
            </HostPortalCard>
          ) : null}

          {(counts.all > 0 || listings.length > 0) ? (
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

          {counts.all === 0 && listings.length === 0 ? (
            <HostListingsEmptyState
              kind="none"
              t={t}
              localePath={localePath}
            />
          ) : listings.length > 0 ? (
            <>
              <HostListingsGrid
                listings={listings}
                t={t}
                locale={locale}
                localePath={localePath}
                listingActionId={listingActionId}
                onPause={onPause}
                onResume={onResume}
              />
              <div ref={sentinelRef} className="h-4" aria-hidden />
              {loadMoreError ? (
                <div className="mt-3 text-center text-sm text-red-800">
                  <p>{loadMoreError}</p>
                  <button
                    type="button"
                    className="mt-1 font-medium text-[color:var(--host-primary)] underline"
                    onClick={() => void loadMore()}
                  >
                    {t("hostPortal.listings.retry")}
                  </button>
                </div>
              ) : null}
              {hasNext ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore
                      ? t("common.loading")
                      : t("hostPortal.loadMore")}
                  </Button>
                </div>
              ) : null}
            </>
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
