"use client";

import React from "react";
import {
  CalendarClock,
  Home,
  CreditCard,
  CheckCircle2,
  XCircle,
  LayoutGrid,
} from "lucide-react";
import type { BookingTabId } from "@/lib/booking-lifecycle";
import { cn } from "@/lib/utils";

const TAB_CONFIG: {
  id: BookingTabId;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}[] = [
  { id: "upcoming", icon: CalendarClock, labelKey: "myBookings.tabs.upcoming" },
  { id: "current", icon: Home, labelKey: "myBookings.tabs.current" },
  { id: "pending", icon: CreditCard, labelKey: "myBookings.tabs.pending" },
  { id: "completed", icon: CheckCircle2, labelKey: "myBookings.tabs.completed" },
  { id: "cancelled", icon: XCircle, labelKey: "myBookings.tabs.cancelled" },
  { id: "all", icon: LayoutGrid, labelKey: "myBookings.tabs.all" },
];

export interface BookingTabsProps {
  activeTab: BookingTabId;
  counts: Record<BookingTabId, number>;
  onChange: (tab: BookingTabId) => void;
  t: (key: string) => string;
}

export function BookingTabs({ activeTab, counts, onChange, t }: BookingTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={t("myBookings.tabsLabel")}
      className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
    >
      {TAB_CONFIG.map(({ id, icon: Icon, labelKey }) => {
        const active = activeTab === id;
        const count = counts[id];
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`bookings-panel-${id}`}
            id={`bookings-tab-${id}`}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border",
              active
                ? "bg-white text-nexa-primary border-nexa-primary/30 shadow-nexa-sm"
                : "bg-transparent text-nexa-ink-3 border-transparent hover:text-nexa-ink hover:bg-white/60",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{t(labelKey)}</span>
            <span
              className={cn(
                "inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full text-[0.65rem] font-bold",
                active ? "bg-nexa-primary text-white" : "bg-nexa-bg-2 text-nexa-ink-4",
              )}
              aria-label={`${count}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
