"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import type { HostBooking, HostListingSummary } from "@/lib/stays-types";
import type { HostListingOption } from "@/lib/stays-api";
import {
  getHostBookings,
  getHostBookingsCounts,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import {
  HOST_BOOKING_FILTER_ORDER,
  addCalendarDaysYmd,
  casablancaYmd,
  exportStatusForBookingFilter,
  type HostBookingFilterId,
  type HostBookingSortId,
} from "@/lib/host-booking-center";
import type { HostBookingsExportState } from "@/components/host/HostBookingCenter";
import type { Locale } from "@/lib/i18n";
import { HostBookingsHeader } from "@/components/host/bookings/HostBookingsHeader";
import { HostBookingsSummary } from "@/components/host/bookings/HostBookingsSummary";
import { HostBookingsFilters } from "@/components/host/bookings/HostBookingsFilters";
import { HostBookingsList } from "@/components/host/bookings/HostBookingsList";
import { HostBookingSkeleton } from "@/components/host/bookings/HostBookingSkeleton";
import { HostBookingEmptyState } from "@/components/host/bookings/HostBookingEmptyState";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { useHostCursorList } from "@/lib/use-host-cursor-list";
import { findHostPortalScrollRoot } from "@/lib/host-portal-scroll-root";

type TranslateFn = (key: string) => string;

export type HostBookingsPageProps = {
  listingOptions: HostListingOption[];
  filter: HostBookingFilterId;
  onFilterChange: (filter: HostBookingFilterId) => void;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  token: string | null;
  exportState: HostBookingsExportState;
  onExportStateChange: (patch: Partial<HostBookingsExportState>) => void;
  onExportCsv: () => void;
  exportSubmitting?: boolean;
};

const PAGE_SIZE = 20;

export function HostBookingsPage({
  listingOptions,
  filter,
  onFilterChange,
  t,
  locale,
  localePath,
  token,
  exportState,
  onExportStateChange,
  onExportCsv,
  exportSubmitting,
}: HostBookingsPageProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listingId, setListingId] = useState("");
  const [sort, setSort] = useState<HostBookingSortId>("ops");
  const [exportOpen, setExportOpen] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<HostBookingFilterId, number>>>(
    {},
  );
  const [countsError, setCountsError] = useState<string | null>(null);

  const todayYmd = useMemo(() => casablancaYmd(), []);
  const tomorrowYmd = useMemo(
    () => addCalendarDaysYmd(todayYmd, 1),
    [todayYmd],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (exportState.listingId) setListingId(exportState.listingId);
  }, [exportState.listingId]);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        filter,
        search: debouncedSearch,
        listingId,
        sort,
      }),
    [filter, debouncedSearch, listingId, sort],
  );

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      if (!token) {
        return {
          items: [] as HostBooking[],
          pagination: { limit: PAGE_SIZE, has_next: false, next_cursor: null },
        };
      }
      try {
        return await getHostBookings(token, {
          limit: PAGE_SIZE,
          cursor,
          filter,
          search: debouncedSearch || undefined,
          listing_id: listingId || undefined,
          sort,
        });
      } catch (e) {
        throw new Error(
          formatUserError(e) || t("hostDashboard.bookingsLoadFailed"),
        );
      }
    },
    [token, filter, debouncedSearch, listingId, sort, t],
  );

  const {
    items: bookings,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasNext,
    loadMore,
    reload,
  } = useHostCursorList<HostBooking>({
    enabled: Boolean(token),
    queryKey,
    fetchPage,
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setCountsError(null);
    getHostBookingsCounts(token, {
      search: debouncedSearch || undefined,
      listing_id: listingId || undefined,
    })
      .then((c) => {
        if (cancelled) return;
        const next: Partial<Record<HostBookingFilterId, number>> = {};
        for (const id of HOST_BOOKING_FILTER_ORDER) {
          next[id] = c[id] ?? 0;
        }
        next.checkin_today = c.checkin_today ?? 0;
        next.checkout_today = c.checkout_today ?? 0;
        setCounts(next);
      })
      .catch((e) => {
        if (cancelled) return;
        setCountsError(
          formatUserError(e) || t("hostDashboard.bookingsLoadFailed"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token, debouncedSearch, listingId, t]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNext) return;
    const root = findHostPortalScrollRoot(el);
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { root, rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNext, loadMore, bookings.length]);

  const handleListingChange = (id: string) => {
    setListingId(id);
    onExportStateChange({ listingId: id });
  };

  const handleFilterChange = (next: HostBookingFilterId) => {
    onFilterChange(next);
    const mapped = exportStatusForBookingFilter(next);
    onExportStateChange({ status: mapped ?? "" });
  };

  const handleClearToAll = () => {
    setSearch("");
    setListingId("");
    onExportStateChange({ listingId: "" });
    handleFilterChange("all");
  };

  const totalForHeader = counts.all ?? bookings.length;
  const countLabel =
    !loading && !error
      ? t("hostDashboard.bookingCenterCount").replace(
          "{count}",
          String(totalForHeader),
        )
      : null;

  const listingSummariesForFilters = useMemo(
    () =>
      listingOptions.map(
        (l) =>
          ({
            id: l.id,
            title: l.title,
          }) as HostListingSummary,
      ),
    [listingOptions],
  );

  return (
    <div id="host-bookings" className="scroll-mt-24 pb-4">
      <HostBookingsHeader
        t={t}
        exportOpen={exportOpen}
        onToggleExport={() => setExportOpen((v) => !v)}
        countLabel={countLabel}
      />

      {exportOpen ? (
        <HostPortalCard className="mb-6 space-y-3 p-4 sm:p-5">
          <p className="text-xs text-[color:var(--host-muted)]">
            {t("hostDashboard.exportCsvHint")}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NexaSelect
              variant="field"
              value={exportState.period}
              onChange={(v) =>
                onExportStateChange({
                  period:
                    v === "last_30_days" ||
                    v === "this_year" ||
                    v === "custom" ||
                    v === "all"
                      ? v
                      : "all",
                })
              }
              aria-label={t("hostDashboard.exportPeriod")}
              options={[
                { value: "all", label: t("hostDashboard.exportPeriodAll") },
                {
                  value: "last_30_days",
                  label: t("hostDashboard.exportPeriodLast30"),
                },
                {
                  value: "this_year",
                  label: t("hostDashboard.exportPeriodThisYear"),
                },
                {
                  value: "custom",
                  label: t("hostDashboard.exportPeriodCustom"),
                },
              ]}
            />
            <NexaSelect
              variant="field"
              value={exportState.listingId}
              onChange={(v) => {
                onExportStateChange({ listingId: v });
                setListingId(v);
              }}
              aria-label={t("hostDashboard.listing")}
              options={[
                { value: "", label: t("hostDashboard.exportListingAll") },
                ...listingOptions.map((l) => ({
                  value: l.id,
                  label: l.title,
                })),
              ]}
            />
            <NexaSelect
              variant="field"
              value={exportState.status}
              onChange={(v) => onExportStateChange({ status: v })}
              aria-label={t("hostDashboard.exportStatusAll")}
              options={[
                { value: "", label: t("hostDashboard.exportStatusAll") },
                {
                  value: "CONFIRMED",
                  label: t("hostDashboard.bookingStatus.CONFIRMED"),
                },
                {
                  value: "CHECKED_IN",
                  label: t("hostDashboard.bookingStatus.CHECKED_IN"),
                },
                {
                  value: "COMPLETED",
                  label: t("hostDashboard.bookingStatus.COMPLETED"),
                },
                {
                  value: "PAYMENT_PENDING",
                  label: t("hostDashboard.bookingStatus.PAYMENT_PENDING"),
                },
                {
                  value: "INITIATED",
                  label: t("hostDashboard.bookingStatus.INITIATED"),
                },
                {
                  value: "CANCELLED_BY_GUEST",
                  label: t("hostDashboard.bookingStatus.CANCELLED_BY_GUEST"),
                },
                {
                  value: "CANCELLED_BY_HOST",
                  label: t("hostDashboard.bookingStatus.CANCELLED_BY_HOST"),
                },
                {
                  value: "EXPIRED",
                  label: t("hostDashboard.bookingStatus.EXPIRED"),
                },
              ]}
            />
          </div>
          {exportState.period === "custom" ? (
            <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <DatePicker
                variant="field"
                value={exportState.from}
                onChange={(from) => onExportStateChange({ from })}
                aria-label={t("hostDashboard.exportFrom")}
                placeholder={t("hostDashboard.exportFrom")}
              />
              <DatePicker
                variant="field"
                value={exportState.to}
                onChange={(to) => onExportStateChange({ to })}
                min={exportState.from || undefined}
                aria-label={t("hostDashboard.exportTo")}
                placeholder={t("hostDashboard.exportTo")}
              />
            </div>
          ) : null}
          <Button
            type="button"
            className="h-10"
            disabled={exportSubmitting}
            onClick={onExportCsv}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportSubmitting
              ? t("hostDashboard.exportingCsv")
              : t("hostDashboard.exportCsv")}
          </Button>
        </HostPortalCard>
      ) : null}

      {!loading && !error ? (
        <HostBookingsSummary
          counts={counts}
          activeFilter={filter}
          onSelect={handleFilterChange}
          t={t}
        />
      ) : null}

      {countsError ? (
        <p className="mb-2 text-xs text-[color:var(--host-text-secondary)]">
          {countsError}
        </p>
      ) : null}

      <HostBookingsFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        listingId={listingId}
        onListingChange={handleListingChange}
        listings={listingSummariesForFilters}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        counts={counts}
        t={t}
      />

      {(filter === "checkin_today" || filter === "checkout_today") && (
        <p className="mb-4 text-xs text-[color:var(--host-text-secondary)]">
          {t("hostDashboard.bookingFocusedFilterHint")}
          <button
            type="button"
            className="ms-2 font-medium text-[color:var(--host-primary)] underline"
            onClick={() => handleFilterChange("today")}
          >
            {t("hostDashboard.bookingFilterToday")}
          </button>
        </p>
      )}

      {loading ? (
        <HostBookingSkeleton />
      ) : error && bookings.length === 0 ? (
        <HostPortalCard className="border-red-100 bg-red-50 px-4 py-5 text-sm text-red-900">
          <p>{error}</p>
          <button
            type="button"
            className="mt-2 font-medium text-[color:var(--host-primary)] underline"
            onClick={() => void reload()}
          >
            {t("hostDashboard.retryDashboard")}
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
                {t("hostDashboard.retryDashboard")}
              </button>
            </HostPortalCard>
          ) : null}
          {bookings.length > 0 ? (
            <>
              <HostBookingsList
                bookings={bookings}
                todayYmd={todayYmd}
                tomorrowYmd={tomorrowYmd}
                t={t}
                locale={locale}
                localePath={localePath}
                token={token}
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
                    {t("hostDashboard.retryDashboard")}
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
            <HostBookingEmptyState
              filter={filter}
              hasAnyBookings={(counts.all ?? 0) > 0}
              hasActiveSearchOrListing={Boolean(
                search.trim() || listingId || filter !== "all",
              )}
              onClearFilter={handleClearToAll}
              t={t}
              localePath={localePath}
            />
          )}
        </>
      )}
    </div>
  );
}
