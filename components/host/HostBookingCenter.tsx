"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Download } from "lucide-react";
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
  type HostBookingFilterId,
} from "@/lib/host-booking-center";
import { HostBookingFilters } from "@/components/host/HostBookingFilters";
import { HostBookingRow } from "@/components/host/HostBookingRow";
import type { Locale } from "@/lib/i18n";

type TranslateFn = (key: string) => string;

export type HostBookingsExportState = {
  period: "last_30_days" | "this_year" | "all" | "custom";
  from: string;
  to: string;
  listingId: string;
  status: string;
};

interface HostBookingCenterProps {
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
  /** Existing CSV export plumbing from dashboard page */
  exportState: HostBookingsExportState;
  onExportStateChange: (patch: Partial<HostBookingsExportState>) => void;
  onExportCsv: () => void;
  exportSubmitting?: boolean;
}

const EMPTY_KEYS: Record<HostBookingFilterId, string> = {
  all: "hostDashboard.bookingEmptyAll",
  today: "hostDashboard.bookingEmptyToday",
  checkin_today: "hostDashboard.bookingEmptyCheckinToday",
  checkout_today: "hostDashboard.bookingEmptyCheckoutToday",
  upcoming: "hostDashboard.bookingEmptyUpcoming",
  current: "hostDashboard.bookingEmptyCurrent",
  awaiting_payment: "hostDashboard.bookingEmptyPaymentPending",
  completed: "hostDashboard.bookingEmptyCompleted",
  cancelled: "hostDashboard.bookingEmptyCancelled",
};

export function HostBookingCenter({
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
  exportState,
  onExportStateChange,
  onExportCsv,
  exportSubmitting,
}: HostBookingCenterProps) {
  const [search, setSearch] = useState("");
  const [listingId, setListingId] = useState("");
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
    return result;
  }, [bookings, todayYmd, tomorrowYmd]);

  const visible = useMemo(
    () =>
      filterHostBookings({
        bookings,
        filter,
        listingId: listingId || undefined,
        search,
        todayYmd,
        tomorrowYmd,
      }),
    [bookings, filter, listingId, search, todayYmd, tomorrowYmd],
  );

  const handleListingChange = (id: string) => {
    setListingId(id);
    onExportStateChange({ listingId: id });
  };

  const handleFilterChange = (next: HostBookingFilterId) => {
    onFilterChange(next);
    const mapped = exportStatusForBookingFilter(next);
    onExportStateChange({ status: mapped ?? "" });
  };

  return (
    <section
      id="host-bookings"
      className="rounded-2xl border border-nexa-line bg-white overflow-hidden mb-8 scroll-mt-24"
      aria-labelledby="host-booking-center-heading"
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
          <div>
            <h2
              id="host-booking-center-heading"
              className="text-lg font-semibold text-nexa-ink flex items-center gap-2"
            >
              <CalendarCheck className="h-5 w-5 text-nexa-primary" aria-hidden />
              {t("hostDashboard.bookingCenterTitle")}
            </h2>
            <p className="text-sm text-nexa-ink-3 mt-1">
              {t("hostDashboard.bookingCenterDesc")}
            </p>
            {!loading && !error ? (
              <p className="text-xs text-nexa-ink-4 mt-1 tabular-nums">
                {t("hostDashboard.bookingCenterCount").replace(
                  "{count}",
                  String(bookings.length),
                )}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => setExportOpen((v) => !v)}
              aria-expanded={exportOpen}
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("hostDashboard.exportCsv")}
            </Button>
          </div>
        </div>

        {exportOpen ? (
          <div className="mb-5 rounded-xl border border-nexa-line bg-nexa-bg-1 p-4 space-y-3">
            <p className="text-xs text-nexa-ink-4">
              {t("hostDashboard.exportCsvHint")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  { value: "CONFIRMED", label: t("hostDashboard.bookingStatus.CONFIRMED") },
                  { value: "CHECKED_IN", label: t("hostDashboard.bookingStatus.CHECKED_IN") },
                  { value: "COMPLETED", label: t("hostDashboard.bookingStatus.COMPLETED") },
                  {
                    value: "PAYMENT_PENDING",
                    label: t("hostDashboard.bookingStatus.PAYMENT_PENDING"),
                  },
                  { value: "INITIATED", label: t("hostDashboard.bookingStatus.INITIATED") },
                  {
                    value: "CANCELLED_BY_GUEST",
                    label: t("hostDashboard.bookingStatus.CANCELLED_BY_GUEST"),
                  },
                  {
                    value: "CANCELLED_BY_HOST",
                    label: t("hostDashboard.bookingStatus.CANCELLED_BY_HOST"),
                  },
                  { value: "EXPIRED", label: t("hostDashboard.bookingStatus.EXPIRED") },
                ]}
              />
            </div>
            {exportState.period === "custom" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
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
              {exportSubmitting
                ? t("hostDashboard.exportingCsv")
                : t("hostDashboard.exportCsv")}
            </Button>
          </div>
        ) : null}

        <HostBookingFilters
          filter={filter}
          onFilterChange={handleFilterChange}
          listingId={listingId}
          onListingChange={handleListingChange}
          listings={listings}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
          t={t}
        />

        {(filter === "checkin_today" || filter === "checkout_today") && (
          <p className="mb-4 text-xs text-nexa-ink-3">
            {t("hostDashboard.bookingFocusedFilterHint")}
            <button
              type="button"
              className="ms-2 text-nexa-primary font-medium underline"
              onClick={() => handleFilterChange("today")}
            >
              {t("hostDashboard.bookingFilterToday")}
            </button>
          </p>
        )}

        {loading ? (
          <div className="py-12 text-center text-nexa-ink-4">
            {t("hostDashboard.loadingBookings")}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-5 text-sm text-red-900">
            <p>{error}</p>
            {onRetry ? (
              <button
                type="button"
                className="mt-2 font-medium text-nexa-primary underline"
                onClick={onRetry}
              >
                {t("hostDashboard.retryDashboard")}
              </button>
            ) : null}
          </div>
        ) : visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map((b) => (
              <HostBookingRow
                key={b.id}
                booking={b}
                todayYmd={todayYmd}
                tomorrowYmd={tomorrowYmd}
                t={t}
                locale={locale}
                localePath={localePath}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-nexa-line bg-nexa-bg-1 p-6 text-center">
            <CalendarCheck className="h-10 w-10 text-nexa-ink-4 mx-auto mb-2" aria-hidden />
            <p className="text-nexa-ink-3 text-sm">{t(EMPTY_KEYS[filter] ?? EMPTY_KEYS.all)}</p>
            {filter !== "all" ? (
              <button
                type="button"
                className="mt-3 text-sm font-medium text-nexa-primary underline"
                onClick={() => handleFilterChange("all")}
              >
                {t("hostDashboard.bookingShowAll")}
              </button>
            ) : (
              <p className="text-nexa-ink-4 text-xs mt-1">
                {t("hostDashboard.bookingsAppearHere")}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
