"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NexaSelect } from "@/components/ui/NexaSelect";
import type { BookingFilters } from "@/lib/booking-lifecycle";
import { Filter, X } from "lucide-react";

export interface BookingFiltersPanelProps {
  filters: BookingFilters;
  cities: string[];
  onChange: (patch: Partial<BookingFilters>) => void;
  onApply: () => void;
  onClear: () => void;
  t: (key: string) => string;
  className?: string;
  embedded?: boolean;
}

export function BookingFiltersPanel({
  filters,
  cities,
  onChange,
  onApply,
  onClear,
  t,
  className,
  embedded = false,
}: BookingFiltersPanelProps) {
  const inner = (
    <div className={embedded ? className : "rounded-2xl border border-nexa-line/70 bg-gradient-to-b from-nexa-primary-soft/30 to-white p-5 shadow-nexa-sm sticky top-24"}>
        <h2 className="font-semibold text-nexa-ink mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-nexa-primary" aria-hidden />
          {t("myBookings.filterSort")}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-nexa-ink-4 mb-1.5 block">
              {t("myBookings.filterDate")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onChange({ dateFrom: e.target.value })}
                aria-label={t("myBookings.dateFrom")}
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onChange({ dateTo: e.target.value })}
                aria-label={t("myBookings.dateTo")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-status" className="text-xs font-medium text-nexa-ink-4 mb-1.5 block">
              {t("myBookings.filterStatus")}
            </label>
            <NexaSelect
              id="filter-status"
              variant="field"
              value={filters.status}
              onChange={(status) => onChange({ status })}
              aria-label={t("myBookings.filterStatus")}
              options={[
                { value: "all", label: t("myBookings.allStatuses") },
                { value: "UPCOMING", label: t("myBookings.lifecycle.UPCOMING") },
                { value: "ACTIVE", label: t("myBookings.lifecycle.ACTIVE") },
                {
                  value: "PENDING_PAYMENT",
                  label: t("myBookings.lifecycle.PENDING_PAYMENT"),
                },
                { value: "COMPLETED", label: t("myBookings.lifecycle.COMPLETED") },
                { value: "CANCELLED", label: t("myBookings.lifecycle.CANCELLED") },
                { value: "EXPIRED", label: t("myBookings.lifecycle.EXPIRED") },
              ]}
            />
          </div>

          <div>
            <label htmlFor="filter-city" className="text-xs font-medium text-nexa-ink-4 mb-1.5 block">
              {t("myBookings.filterCity")}
            </label>
            <NexaSelect
              id="filter-city"
              variant="field"
              value={filters.city}
              onChange={(city) => onChange({ city })}
              aria-label={t("myBookings.filterCity")}
              options={[
                { value: "all", label: t("myBookings.allCities") },
                ...cities.map((city) => ({ value: city, label: city })),
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-nexa-ink-4 mb-1.5 block">
              {t("myBookings.filterPrice")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                placeholder={t("myBookings.min")}
                value={filters.priceMin}
                onChange={(e) => onChange({ priceMin: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                placeholder={t("myBookings.max")}
                value={filters.priceMax}
                onChange={(e) => onChange({ priceMax: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-sort" className="text-xs font-medium text-nexa-ink-4 mb-1.5 block">
              {t("myBookings.sortBy")}
            </label>
            <NexaSelect
              id="filter-sort"
              variant="field"
              value={filters.sort}
              onChange={(sort) =>
                onChange({ sort: sort as BookingFilters["sort"] })
              }
              aria-label={t("myBookings.sortBy")}
              options={[
                { value: "newest", label: t("myBookings.sortNewest") },
                { value: "oldest", label: t("myBookings.sortOldest") },
                { value: "checkin", label: t("myBookings.sortCheckin") },
                { value: "price", label: t("myBookings.sortPrice") },
                { value: "guests", label: t("myBookings.sortGuests") },
              ]}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={onApply} className="w-full gap-2">
            <Filter className="h-4 w-4" aria-hidden />
            {t("myBookings.applyFilters")}
          </Button>
          <Button variant="ghost" onClick={onClear} className="w-full text-nexa-primary gap-2">
            <X className="h-4 w-4" aria-hidden />
            {t("myBookings.clearFilters")}
          </Button>
        </div>
      </div>
  );

  if (embedded) {
    return <div aria-label={t("myBookings.filterSort")}>{inner}</div>;
  }

  return (
    <aside className={className} aria-label={t("myBookings.filterSort")}>
      {inner}
    </aside>
  );
}
