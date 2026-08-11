"use client";

import React from "react";
import type { HostBooking } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { HostBookingCard } from "@/components/host/bookings/HostBookingCard";

type TranslateFn = (key: string) => string;

type Props = {
  bookings: HostBooking[];
  todayYmd: string;
  tomorrowYmd: string;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  token: string | null;
};

export function HostBookingsList({
  bookings,
  todayYmd,
  tomorrowYmd,
  t,
  locale,
  localePath,
  token,
}: Props) {
  return (
    <div className="space-y-3" role="list">
      {bookings.map((b) => (
        <div key={b.id} role="listitem">
          <HostBookingCard
            booking={b}
            todayYmd={todayYmd}
            tomorrowYmd={tomorrowYmd}
            t={t}
            locale={locale}
            localePath={localePath}
            token={token}
          />
        </div>
      ))}
    </div>
  );
}
