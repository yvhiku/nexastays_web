"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CalendarCheck,
  LogOut,
  Users,
  CreditCard,
  Sparkles,
  Link2,
  ListFilter,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostDashboardAggregate } from "@/lib/stays-types";

type TranslateFn = (key: string) => string;

interface HostTodaySectionProps {
  dashboard: HostDashboardAggregate | null;
  loading?: boolean;
  t: TranslateFn;
  /** Prefer real portal routes over in-page hash scroll. */
  localePath?: (path: string) => string;
  onOpenBookings?: (filter: "checkin_today" | "checkout_today" | "awaiting_payment" | "today") => void;
}

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HostTodaySection({
  dashboard,
  loading,
  t,
  localePath,
  onOpenBookings,
}: HostTodaySectionProps) {
  const router = useRouter();
  if (loading && !dashboard) {
    return (
      <section
        className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8 animate-pulse"
        aria-busy="true"
      >
        <div className="h-5 w-32 bg-nexa-bg-2 rounded mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-nexa-bg-2 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!dashboard) return null;

  const { today, calendar_status, listing_health } = dashboard;

  const metrics: Array<{
    key: string;
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    emphasize?: boolean;
  }> = [
    {
      key: "checkins",
      label: t("hostDashboard.metricCheckinsToday"),
      value: today.checkins_today,
      icon: CalendarCheck,
      emphasize: today.checkins_today > 0,
    },
    {
      key: "checkouts",
      label: t("hostDashboard.metricCheckoutsToday"),
      value: today.checkouts_today,
      icon: LogOut,
      emphasize: today.checkouts_today > 0,
    },
    {
      key: "checkouts_tmr",
      label: t("hostDashboard.metricCheckoutsTomorrow"),
      value: today.checkouts_tomorrow,
      icon: LogOut,
    },
    {
      key: "staying",
      label: t("hostDashboard.currentlyStaying"),
      value: today.currently_staying,
      icon: Users,
    },
    {
      key: "new",
      label: t("hostDashboard.metricNewBookingsToday"),
      value: today.new_bookings_today,
      icon: Sparkles,
    },
    {
      key: "payment",
      label: t("hostDashboard.metricAwaitingPayment"),
      value: today.awaiting_guest_payment,
      icon: CreditCard,
      emphasize: today.awaiting_guest_payment > 0,
    },
  ];

  const signals: Array<{
    key: string;
    label: string;
    target: string;
    bookingFilter?: "checkin_today" | "checkout_today" | "awaiting_payment" | "today";
  }> = [];

  if (today.checkins_today > 0) {
    signals.push({
      key: "a-in",
      label: t("hostDashboard.actionCheckinsToday").replace(
        "{count}",
        String(today.checkins_today),
      ),
      target: "host-bookings",
      bookingFilter: "checkin_today",
    });
  }
  if (today.checkouts_today > 0) {
    signals.push({
      key: "a-out",
      label: t("hostDashboard.actionCheckoutsToday").replace(
        "{count}",
        String(today.checkouts_today),
      ),
      target: "host-bookings",
      bookingFilter: "checkout_today",
    });
  }
  if (today.awaiting_guest_payment > 0) {
    signals.push({
      key: "a-pay",
      label: t("hostDashboard.actionAwaitingPayment").replace(
        "{count}",
        String(today.awaiting_guest_payment),
      ),
      target: "host-bookings",
      bookingFilter: "awaiting_payment",
    });
  }
  if (calendar_status.listings_needing_attention > 0) {
    signals.push({
      key: "a-cal",
      label: t("hostDashboard.actionCalendarIssue").replace(
        "{count}",
        String(calendar_status.listings_needing_attention),
      ),
      target: "host-calendar-sync",
    });
  }
  if ((listing_health.missing?.length ?? 0) > 0 || !listing_health.photos_complete) {
    const missingLabel =
      listing_health.missing?.[0]?.label ??
      t("hostDashboard.actionListingHealth");
    signals.push({
      key: "a-list",
      label: missingLabel,
      target: "host-listings",
    });
  }
  if (today.checkouts_tomorrow > 0 && today.checkouts_today === 0) {
    signals.push({
      key: "a-tmr",
      label: t("hostDashboard.actionCheckoutsTomorrow").replace(
        "{count}",
        String(today.checkouts_tomorrow),
      ),
      target: "host-bookings",
    });
  }
  if (today.new_bookings_today > 0) {
    signals.push({
      key: "a-new",
      label: t("hostDashboard.actionNewBookingsToday").replace(
        "{count}",
        String(today.new_bookings_today),
      ),
      target: "host-bookings",
    });
  }

  const hasSignals = signals.length > 0;

  return (
    <section
      className="mb-6 rounded-2xl border border-nexa-line bg-white overflow-hidden"
      aria-labelledby="host-today-heading"
    >
      <div className="p-6 sm:p-8">
        <h2
          id="host-today-heading"
          className="text-lg font-semibold text-nexa-ink mb-1"
        >
          {t("hostDashboard.todayHeading")}
        </h2>
        <p className="text-sm text-nexa-ink-3 mb-5">
          {t("hostDashboard.todayActionsDesc")}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className={cn(
                  "rounded-xl border px-3 py-3",
                  m.emphasize
                    ? "border-nexa-line bg-nexa-bg-1"
                    : "border-nexa-line bg-nexa-bg-1",
                )}
              >
                <div className="flex items-center gap-2 text-nexa-ink-3 mb-1">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="text-xs leading-tight">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-nexa-ink tabular-nums">
                  {m.value}
                </p>
              </div>
            );
          })}
        </div>

        {!hasSignals ? (
          <div className="flex items-center gap-3 rounded-xl bg-nexa-bg-1 border border-nexa-line px-4 py-3 text-sm text-nexa-ink-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-nexa-ink-4" aria-hidden />
            {t("hostDashboard.todayAllClear")}
          </div>
        ) : (
          <ul className="divide-y divide-nexa-line border border-nexa-line rounded-xl overflow-hidden">
            {signals.map((row) => {
              const isFilter = Boolean(row.bookingFilter);
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (localePath) {
                        if (row.target === "host-bookings") {
                          const q = row.bookingFilter
                            ? `?filter=${row.bookingFilter}`
                            : "";
                          router.push(localePath(`/host/bookings${q}`));
                          return;
                        }
                        if (row.target === "host-listings") {
                          router.push(localePath("/host/listings"));
                          return;
                        }
                      }
                      if (row.bookingFilter && onOpenBookings) {
                        onOpenBookings(row.bookingFilter);
                      }
                      scrollToId(row.target);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-nexa-bg-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nexa-primary/30"
                    aria-label={
                      isFilter
                        ? `${row.label}. ${t("hostDashboard.viewBookingsLink")}`
                        : row.label
                    }
                  >
                    {isFilter ? (
                      <ListFilter
                        className="h-4 w-4 text-nexa-ink-4 shrink-0"
                        aria-hidden
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4 text-nexa-ink-4 shrink-0 rtl:rotate-180"
                        aria-hidden
                      />
                    )}
                    <span className="flex-1 text-sm text-nexa-ink">{row.label}</span>
                    <span className="text-xs text-nexa-ink-3 font-medium">
                      {row.target === "host-bookings"
                        ? t("hostDashboard.viewBookingsLink")
                        : row.target === "host-calendar-sync"
                          ? t("hostDashboard.calendarSyncCta")
                          : t("hostDashboard.viewListingsLink")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!calendar_status.healthy && calendar_status.listings_needing_attention === 0 ? (
          <p className="mt-3 text-xs text-nexa-ink-4 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            {t("hostDashboard.calendarNeedsReview")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
