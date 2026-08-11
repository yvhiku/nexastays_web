"use client";

import React from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";
import type { HostBookingFilterId } from "@/lib/host-booking-center";

type TranslateFn = (key: string) => string;

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

type Props = {
  filter: HostBookingFilterId;
  hasAnyBookings: boolean;
  hasActiveSearchOrListing: boolean;
  onClearFilter: () => void;
  t: TranslateFn;
  localePath: (path: string) => string;
};

export function HostBookingEmptyState({
  filter,
  hasAnyBookings,
  hasActiveSearchOrListing,
  onClearFilter,
  t,
  localePath,
}: Props) {
  const noBookingsAtAll =
    !hasAnyBookings && filter === "all" && !hasActiveSearchOrListing;

  return (
    <HostPortalCard className="border-dashed p-8 text-center sm:p-10">
      <CalendarCheck
        className="mx-auto mb-3 h-10 w-10 text-[color:var(--host-muted)]"
        aria-hidden
      />
      {noBookingsAtAll ? (
        <>
          <p className="text-base font-medium text-[color:var(--host-text)]">
            {t("hostPortal.bookings.emptyNoneTitle")}
          </p>
          <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
            {t("hostPortal.bookings.emptyNoneDesc")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline" className="h-10">
              <Link href={localePath("/host/listings")}>
                {t("hostPortal.nav.listings")}
              </Link>
            </Button>
            <Button asChild className="h-10">
              <Link href={localePath("/host/dashboard")}>
                {t("hostPortal.nav.home")}
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-base font-medium text-[color:var(--host-text)]">
            {t("hostPortal.bookings.emptyFilterTitle")}
          </p>
          <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
            {t(EMPTY_KEYS[filter] ?? EMPTY_KEYS.all)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--host-muted)]">
            {t("hostPortal.bookings.emptyFilterHint")}
          </p>
          {filter !== "all" || hasActiveSearchOrListing ? (
            <button
              type="button"
              className="mt-4 text-sm font-medium text-[color:var(--host-primary)] underline"
              onClick={onClearFilter}
            >
              {t("hostDashboard.bookingShowAll")}
            </button>
          ) : null}
        </>
      )}
    </HostPortalCard>
  );
}
