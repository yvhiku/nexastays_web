"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { HostBookingUrgency } from "@/lib/host-booking-center";

type TranslateFn = (key: string) => string;

const URGENCY_I18N: Record<HostBookingUrgency, string> = {
  checkout_today: "hostDashboard.urgencyCheckoutToday",
  checkin_today: "hostDashboard.urgencyCheckinToday",
  checkin_tomorrow: "hostDashboard.urgencyCheckinTomorrow",
  awaiting_payment: "hostDashboard.urgencyAwaitingPayment",
  staying: "hostDashboard.urgencyStaying",
  upcoming: "hostDashboard.urgencyUpcoming",
  completed: "hostDashboard.urgencyCompleted",
  cancelled: "hostDashboard.urgencyCancelled",
  other: "hostDashboard.urgencyOther",
};

export function HostBookingUrgencyBadge({
  urgency,
  t,
  className,
}: {
  urgency: HostBookingUrgency;
  t: TranslateFn;
  className?: string;
}) {
  const label = t(URGENCY_I18N[urgency]);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border",
        urgency === "checkout_today" ||
        urgency === "checkin_today" ||
        urgency === "checkin_tomorrow" ||
        urgency === "staying"
          ? "bg-nexa-bg-1 text-nexa-ink-2 border-nexa-line"
          : urgency === "awaiting_payment"
            ? "bg-nexa-bg-1 text-nexa-ink-2 border-nexa-line"
            : urgency === "cancelled"
              ? "bg-red-50 text-red-800 border-red-100"
              : "bg-nexa-bg-1 text-nexa-ink-3 border-nexa-line",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function HostBookingStatusBadge({
  status,
  t,
  className,
}: {
  status: string;
  t: TranslateFn;
  className?: string;
}) {
  const key = `hostDashboard.bookingStatus.${status}`;
  const label = t(key) !== key ? t(key) : status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border border-nexa-line bg-white text-nexa-ink-2",
        className,
      )}
      title={status}
    >
      {label}
    </span>
  );
}
