"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  HOST_BOOKING_FILTER_ORDER,
  type HostBookingFilterId,
} from "@/lib/host-booking-center";
import type { HostListingSummary } from "@/lib/stays-types";
import { NexaSelect } from "@/components/ui/NexaSelect";

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

interface HostBookingFiltersProps {
  filter: HostBookingFilterId;
  onFilterChange: (filter: HostBookingFilterId) => void;
  listingId: string;
  onListingChange: (id: string) => void;
  listings: HostListingSummary[];
  search: string;
  onSearchChange: (q: string) => void;
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
    <div className="space-y-4 mb-5">
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
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
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
                active
                  ? "bg-nexa-primary text-white border-nexa-primary"
                  : "bg-white text-nexa-ink-2 border-nexa-line hover:border-nexa-primary/40",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="sr-only">{t("hostDashboard.bookingSearchLabel")}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("hostDashboard.bookingSearchPlaceholder")}
            className="w-full h-10 rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
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
      </div>
    </div>
  );
}
