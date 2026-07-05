"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => onChange({ status: e.target.value })}
              className="w-full h-10 rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
            >
              <option value="all">{t("myBookings.allStatuses")}</option>
              <option value="UPCOMING">{t("myBookings.lifecycle.UPCOMING")}</option>
              <option value="ACTIVE">{t("myBookings.lifecycle.ACTIVE")}</option>
              <option value="PENDING_PAYMENT">{t("myBookings.lifecycle.PENDING_PAYMENT")}</option>
              <option value="COMPLETED">{t("myBookings.lifecycle.COMPLETED")}</option>
              <option value="CANCELLED">{t("myBookings.lifecycle.CANCELLED")}</option>
              <option value="EXPIRED">{t("myBookings.lifecycle.EXPIRED")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-city" className="text-xs font-medium text-nexa-ink-4 mb-1.5 block">
              {t("myBookings.filterCity")}
            </label>
            <select
              id="filter-city"
              value={filters.city}
              onChange={(e) => onChange({ city: e.target.value })}
              className="w-full h-10 rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
            >
              <option value="all">{t("myBookings.allCities")}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
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
            <select
              id="filter-sort"
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as BookingFilters["sort"] })}
              className="w-full h-10 rounded-xl border border-nexa-line bg-white px-3 text-sm text-nexa-ink focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
            >
              <option value="newest">{t("myBookings.sortNewest")}</option>
              <option value="oldest">{t("myBookings.sortOldest")}</option>
              <option value="checkin">{t("myBookings.sortCheckin")}</option>
              <option value="price">{t("myBookings.sortPrice")}</option>
              <option value="guests">{t("myBookings.sortGuests")}</option>
            </select>
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
