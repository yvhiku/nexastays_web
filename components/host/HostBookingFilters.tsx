"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  HOST_BOOKING_FILTER_ORDER,
  HOST_BOOKING_SORT_ORDER,
  type HostBookingFilterId,
  type HostBookingSortId,
} from "@/lib/host-booking-center";
import type { HostListingSummary } from "@/lib/stays-types";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { HostPortalSortSelect } from "@/components/host/portal/HostPortalSortSelect";

type TranslateFn = (key: string) => string;

const FILTER_LABEL_KEYS: Record<HostBookingFilterId, string> = {
  all: "hostDashboard.bookingFilterAll",
  today: "hostDashboard.bookingFilterToday",
  checkin_today: "hostDashboard.bookingFilterCheckinToday",
  checkout_today: "hostDashboard.bookingFilterCheckoutToday",
  upcoming: "hostDashboard.bookingFilterUpcoming",
  current: "hostDashboard.bookingFilterCurrent",
  awaiting_payment: "hostDashboard.bookingFilterPaymentPending",
  completed: "hostDashboard.bookingFilterCompleted",
  cancelled: "hostDashboard.bookingFilterCancelled",
};

const SORT_LABEL_KEYS: Record<HostBookingSortId, string> = {
  ops: "hostPortal.bookings.sortOps",
  checkin: "hostPortal.bookings.sortCheckin",
  checkout: "hostPortal.bookings.sortCheckout",
  amount: "hostPortal.bookings.sortAmount",
  guest: "hostPortal.bookings.sortGuest",
};

interface HostBookingFiltersProps {
  filter: HostBookingFilterId;
  onFilterChange: (filter: HostBookingFilterId) => void;
  listingId: string;
  onListingChange: (id: string) => void;
  listings: HostListingSummary[];
  search: string;
  onSearchChange: (q: string) => void;
  sort: HostBookingSortId;
  onSortChange: (sort: HostBookingSortId) => void;
  counts: Partial<Record<HostBookingFilterId, number>>;
  t: TranslateFn;
}

export function HostBookingFilters({
  filter,
  onFilterChange,
  listingId,
  onListingChange,
  listings,
  search,
  onSearchChange,
  sort,
  onSortChange,
  counts,
  t,
}: HostBookingFiltersProps) {
  const tabs = useMemo(() => {
    const base: HostBookingFilterId[] = [...HOST_BOOKING_FILTER_ORDER];
    if (
      (filter === "checkin_today" || filter === "checkout_today") &&
      !base.includes(filter)
    ) {
      base.splice(2, 0, filter);
    }
    return base;
  }, [filter]);

  return (
    <div className="mb-5 space-y-4">
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label={t("hostDashboard.bookingFiltersAria")}
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
                  ? "border-nexa-primary bg-nexa-primary text-white"
                  : "border-nexa-line bg-white text-nexa-ink-2 hover:border-nexa-primary/40",
              )}
            >
              {t(FILTER_LABEL_KEYS[id])}
              {typeof count === "number" ? (
                <span
                  className={cn(
                    "ms-1.5 tabular-nums",
                    active ? "text-white/90" : "text-nexa-ink-4",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="sr-only">{t("hostDashboard.bookingSearchLabel")}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("hostDashboard.bookingSearchPlaceholder")}
            className="h-10 w-full rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
          />
        </label>
        {listings.length > 1 ? (
          <NexaSelect
            variant="field"
            value={listingId}
            onChange={onListingChange}
            aria-label={t("hostDashboard.listing")}
            options={[
              { value: "", label: t("hostDashboard.exportListingAll") },
              ...listings.map((l) => ({ value: l.id, label: l.title })),
            ]}
          />
        ) : null}
        <HostPortalSortSelect
          label={t("hostPortal.sortBy")}
          value={sort}
          onChange={(v) => onSortChange(v as HostBookingSortId)}
          options={HOST_BOOKING_SORT_ORDER.map((id) => ({
            value: id,
            label: t(SORT_LABEL_KEYS[id]),
          }))}
        />
      </div>
    </div>
  );
}
