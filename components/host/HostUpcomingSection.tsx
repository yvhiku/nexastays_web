"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";
import type { HostBooking, HostDashboardAggregate } from "@/lib/stays-types";
import { parseLocalDateOnly } from "@/lib/booking-dates";

type TranslateFn = (key: string) => string;

interface HostUpcomingSectionProps {
  dashboard: HostDashboardAggregate | null;
  bookings: HostBooking[];
  bookingsLoading?: boolean;
  loading?: boolean;
  t: TranslateFn;
  localePath: (path: string) => string;
}

const UPCOMING_STATUSES = new Set(["CONFIRMED", "CHECKED_IN"]);

export function HostUpcomingSection({
  dashboard,
  bookings,
  bookingsLoading,
  loading,
  t,
  localePath,
}: HostUpcomingSectionProps) {
  const upcomingRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings
      .filter((b) => UPCOMING_STATUSES.has(b.status))
      .filter((b) => {
        const checkin = parseLocalDateOnly(b.checkin_date);
        return checkin >= today;
      })
      .sort(
        (a, b) =>
          parseLocalDateOnly(a.checkin_date).getTime() -
          parseLocalDateOnly(b.checkin_date).getTime(),
      )
      .slice(0, 5);
  }, [bookings]);

  if (loading && !dashboard) {
    return (
      <section
        className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 animate-pulse"
        aria-busy="true"
      >
        <div className="h-5 w-40 bg-nexa-bg-2 rounded mb-4" />
        <div className="h-16 bg-nexa-bg-2 rounded-xl" />
      </section>
    );
  }

  if (!dashboard) return null;

  const { operations } = dashboard;
  const count = operations.upcoming_checkins;

  return (
    <section
      id="host-upcoming"
      className="mb-6 rounded-2xl border border-nexa-line bg-white overflow-hidden scroll-mt-24"
      aria-labelledby="host-upcoming-heading"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2
              id="host-upcoming-heading"
              className="text-lg font-semibold text-nexa-ink flex items-center gap-2"
            >
              <CalendarCheck className="h-5 w-5 text-nexa-primary" aria-hidden />
              {t("hostDashboard.upcomingCheckinsTitle")}
            </h2>
            <p className="text-sm text-nexa-ink-3 mt-1">
              {count === 0
                ? t("hostDashboard.noUpcomingGuests")
                : t("hostDashboard.upcomingCheckinsCount").replace(
                    "{count}",
                    String(count),
                  )}
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-nexa-primary font-medium shrink-0 hover:underline"
            onClick={() =>
              document
                .getElementById("host-bookings")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {t("hostDashboard.viewBookingsLink")}
          </button>
        </div>

        {operations.next_guest_name || operations.next_checkin_date ? (
          <p className="text-sm text-nexa-ink mb-4 rounded-xl bg-nexa-bg-1 border border-nexa-line px-4 py-3">
            {t("hostDashboard.nextGuestLine")
              .replace("{name}", operations.next_guest_name ?? t("hostDashboard.guest"))
              .replace(
                "{when}",
                operations.next_checkin_date ?? t("hostDashboard.relativeToday"),
              )}
          </p>
        ) : null}

        {bookingsLoading ? (
          <p className="text-sm text-nexa-ink-4 py-4">
            {t("hostDashboard.loadingBookings")}
          </p>
        ) : upcomingRows.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-nexa-line bg-nexa-bg-1 p-5 text-center">
            <p className="text-sm text-nexa-ink-3">
              {t("hostDashboard.noUpcomingBookingsDetail")}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcomingRows.map((b) => (
              <li key={b.id}>
                <Link
                  href={localePath(`/bookings/${b.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl border border-nexa-line hover:border-nexa-primary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-nexa-ink truncate">
                      {b.guest_name ?? t("hostDashboard.guest")}
                    </p>
                    <p className="text-sm text-nexa-ink-3 truncate">
                      {b.listing?.title ?? t("hostDashboard.listing")}
                    </p>
                    <p className="text-xs text-nexa-ink-4 mt-1">
                      {b.checkin_date} → {b.checkout_date}
                      <span className="mx-1.5">·</span>
                      <span
                        className={
                          b.status === "CONFIRMED"
                            ? "text-green-700"
                            : "text-amber-700"
                        }
                      >
                        {b.status}
                      </span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-nexa-primary font-medium shrink-0">
                    {t("hostDashboard.viewDetails")}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
