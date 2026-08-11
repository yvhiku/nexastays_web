"use client";

import React from "react";
import { CalendarCheck, CalendarDays, CheckCircle2, Home } from "lucide-react";
import { HostPortalStatCard } from "@/components/host/portal/HostPortalStatCard";
import type { HostBookingFilterId } from "@/lib/host-booking-center";
import { cn } from "@/lib/utils";

type TranslateFn = (key: string) => string;

const SUMMARY: {
  id: HostBookingFilterId;
  labelKey: string;
  hintKey: string;
  icon: typeof CalendarDays;
}[] = [
  {
    id: "today",
    labelKey: "hostPortal.bookings.summaryToday",
    hintKey: "hostPortal.bookings.summaryReservations",
    icon: CalendarCheck,
  },
  {
    id: "upcoming",
    labelKey: "hostPortal.bookings.summaryUpcoming",
    hintKey: "hostPortal.bookings.summaryReservations",
    icon: CalendarDays,
  },
  {
    id: "current",
    labelKey: "hostPortal.bookings.summaryCurrent",
    hintKey: "hostPortal.bookings.summaryStays",
    icon: Home,
  },
  {
    id: "completed",
    labelKey: "hostPortal.bookings.summaryCompleted",
    hintKey: "hostPortal.bookings.summaryReservations",
    icon: CheckCircle2,
  },
];

type Props = {
  counts: Partial<Record<HostBookingFilterId, number>>;
  activeFilter: HostBookingFilterId;
  onSelect: (filter: HostBookingFilterId) => void;
  t: TranslateFn;
};

export function HostBookingsSummary({
  counts,
  activeFilter,
  onSelect,
  t,
}: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {SUMMARY.map((item) => {
        const value = counts[item.id] ?? 0;
        const active = activeFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "rounded-[var(--host-radius)] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--host-primary)]",
              active && "ring-2 ring-[color:var(--host-primary)]",
            )}
            aria-pressed={active}
          >
            <HostPortalStatCard
              label={t(item.labelKey)}
              value={String(value)}
              icon={item.icon}
              supportingText={t(item.hintKey).replace("{count}", String(value))}
              className="h-full p-4 sm:p-5 transition-shadow hover:shadow-[var(--host-shadow-hover)]"
            />
          </button>
        );
      })}
    </div>
  );
}
