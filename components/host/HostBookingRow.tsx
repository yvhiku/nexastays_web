"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HostBooking } from "@/lib/stays-types";
import {
  classifyHostBookingUrgency,
  hostBookingAmountDisplay,
  hostBookingNights,
  toBookingDateYmd,
  type HostBookingUrgency,
} from "@/lib/host-booking-center";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import type { Locale } from "@/lib/i18n";
import {
  HostBookingStatusBadge,
  HostBookingUrgencyBadge,
} from "@/components/host/HostBookingStatusBadge";

type TranslateFn = (key: string) => string;

interface HostBookingRowProps {
  booking: HostBooking;
  todayYmd: string;
  tomorrowYmd: string;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
}

export function HostBookingRow({
  booking,
  todayYmd,
  tomorrowYmd,
  t,
  locale,
  localePath,
}: HostBookingRowProps) {
  const urgency: HostBookingUrgency = classifyHostBookingUrgency(
    booking,
    todayYmd,
    tomorrowYmd,
  );
  const nights = hostBookingNights(booking);
  const amount = hostBookingAmountDisplay(booking);
  const checkin = toBookingDateYmd(booking.checkin_date);
  const checkout = toBookingDateYmd(booking.checkout_date);
  const href = localePath(`/bookings/${booking.id}`);

  const amountLabel =
    amount.kind === "payout"
      ? t("hostDashboard.bookingAmountHostEarnings")
      : amount.kind === "total_paid"
        ? t("hostDashboard.bookingAmountTotalPaid")
        : null;

  return (
    <article
      className="rounded-xl border border-nexa-line bg-white p-4 sm:p-5 hover:border-nexa-primary/35 transition-colors"
      data-urgency={urgency}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <HostBookingUrgencyBadge urgency={urgency} t={t} />
            <HostBookingStatusBadge status={booking.status} t={t} />
          </div>

          <div>
            <h3 className="font-semibold text-nexa-ink truncate">
              {booking.guest_name?.trim() || t("hostDashboard.guest")}
            </h3>
            <p className="text-sm text-nexa-ink-3 truncate">
              {booking.listing?.title ?? t("hostDashboard.listing")}
            </p>
          </div>

          <p className="text-sm text-nexa-ink tabular-nums">
            <span className="font-medium">{checkin}</span>
            <span className="mx-1.5 text-nexa-ink-4">→</span>
            <span className="font-medium">{checkout}</span>
            {nights > 0 ? (
              <span className="ms-2 text-xs text-nexa-ink-4">
                {t("hostDashboard.bookingNights").replace("{count}", String(nights))}
              </span>
            ) : null}
          </p>

          {amount.amount != null && amountLabel ? (
            <p className="text-sm text-nexa-ink-2">
              <span className="text-nexa-ink-4">{amountLabel}: </span>
              <span className="font-medium tabular-nums">
                {formatHostCurrency(amount.amount, booking.currency, locale)}
              </span>
            </p>
          ) : null}
        </div>

        <Link
          href={href}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-nexa-primary text-white text-sm font-medium shrink-0 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
        >
          {t("hostDashboard.viewBooking")}
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
