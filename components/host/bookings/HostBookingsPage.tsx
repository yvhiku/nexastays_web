"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import type { HostBooking, HostListingSummary } from "@/lib/stays-types";
import {
  HOST_BOOKING_FILTER_ORDER,
  addCalendarDaysYmd,
  casablancaYmd,
  exportStatusForBookingFilter,
  filterHostBookings,
  matchesHostBookingFilter,
  sortHostBookings,
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

type TranslateFn = (key: string) => string;

export type HostBookingsPageProps = {
  bookings: HostBooking[];
  listings: HostListingSummary[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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

/**
 * Presentation composer. Domain filtering/urgency/amounts stay in
 * lib/host-booking-center.ts — parity with HostBookingCenter behavior.
 */
export function HostBookingsPage({
  bookings,
  listings,
  loading,
  error,
  onRetry,
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
  const [listingId, setListingId] = useState("");
  const [sort, setSort] = useState<HostBookingSortId>("ops");
  const [exportOpen, setExportOpen] = useState(false);

  const todayYmd = useMemo(() => casablancaYmd(), []);
  const tomorrowYmd = useMemo(
    () => addCalendarDaysYmd(todayYmd, 1),
    [todayYmd],
  );

  useEffect(() => {
    if (exportState.listingId) setListingId(exportState.listingId);
  }, [exportState.listingId]);

  const counts = useMemo(() => {
    const result: Partial<Record<HostBookingFilterId, number>> = {};
    for (const id of HOST_BOOKING_FILTER_ORDER) {
      result[id] = bookings.filter((b) =>
        matchesHostBookingFilter(b, id, todayYmd, tomorrowYmd),
      ).length;
    }
    result.checkin_today = bookings.filter((b) =>
      matchesHostBookingFilter(b, "checkin_today", todayYmd, tomorrowYmd),
    ).length;
    result.checkout_today = bookings.filter((b) =>
      matchesHostBookingFilter(b, "checkout_today", todayYmd, tomorrowYmd),
    ).length;
    return result;
  }, [bookings, todayYmd, tomorrowYmd]);

  const visible = useMemo(() => {
    const filtered = filterHostBookings({
      bookings,
      filter,
      listingId: listingId || undefined,
      search,
      todayYmd,
      tomorrowYmd,
    });
    return sortHostBookings(filtered, sort, todayYmd, tomorrowYmd);
  }, [bookings, filter, listingId, search, sort, todayYmd, tomorrowYmd]);

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

  const countLabel =
    !loading && !error
      ? t("hostDashboard.bookingCenterCount").replace(
          "{count}",
          String(bookings.length),
        )
      : null;

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
                ...listings.map((l) => ({ value: l.id, label: l.title })),
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

      <HostBookingsFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        listingId={listingId}
        onListingChange={handleListingChange}
        listings={listings}
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
          {onRetry ? (
            <button
              type="button"
              className="mt-2 font-medium text-[color:var(--host-primary)] underline"
              onClick={onRetry}
            >
              {t("hostDashboard.retryDashboard")}
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
                  {t("hostDashboard.retryDashboard")}
                </button>
              ) : null}
            </HostPortalCard>
          ) : null}
          {visible.length > 0 ? (
            <HostBookingsList
              bookings={visible}
              todayYmd={todayYmd}
              tomorrowYmd={tomorrowYmd}
              t={t}
              locale={locale}
              localePath={localePath}
              token={token}
            />
          ) : (
            <HostBookingEmptyState
              filter={filter}
              hasAnyBookings={bookings.length > 0}
              hasActiveSearchOrListing={Boolean(search.trim() || listingId)}
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
