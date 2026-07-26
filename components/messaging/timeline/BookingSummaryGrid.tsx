"use client";

import React from "react";
import {
  CalendarDays,
  MapPin,
  MoonStar,
  Users,
  type LucideIcon,
} from "lucide-react";

export type BookingSummaryItem = {
  id: "dates" | "nights" | "guests" | "location";
  label: string;
  value: string;
};

const ICONS: Record<BookingSummaryItem["id"], LucideIcon> = {
  dates: CalendarDays,
  nights: MoonStar,
  guests: Users,
  location: MapPin,
};

export function BookingSummaryGrid({ items }: { items: BookingSummaryItem[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-4 max-[419px]:grid-cols-1">
      {items.map((item) => {
        const Icon = ICONS[item.id];
        return (
          <div key={item.id} className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-nexa-ink-4">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-[13px] font-medium leading-5 text-nexa-ink-2">
                {item.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
