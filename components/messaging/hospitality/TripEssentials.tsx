"use client";

import React from "react";
import { CalendarClock, DoorOpen, MapPin, Users } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { useLanguage } from "@/contexts/LanguageContext";

export function TripEssentials({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const { t, locale } = useLanguage();
  const reservation = conversation.presentation.reservation;
  const date = (value: string) => {
    const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsed.getTime())
      ? ""
      : new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
        }).format(parsed);
  };
  const rows = [
    reservation.addressDisplay
      ? { id: "address", label: t("inbox.phase14.address"), value: reservation.addressDisplay, Icon: MapPin }
      : null,
    reservation.checkinDate
      ? { id: "checkin", label: t("inbox.phase14.checkin"), value: date(reservation.checkinDate), Icon: CalendarClock }
      : null,
    reservation.checkoutDate
      ? { id: "checkout", label: t("inbox.phase14.checkout"), value: date(reservation.checkoutDate), Icon: DoorOpen }
      : null,
    reservation.guestCount > 0
      ? { id: "guests", label: t("inbox.guests"), value: String(reservation.guestCount), Icon: Users }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    value: string;
    Icon: React.ComponentType<{ className?: string }>;
  }>;
  if (!rows.length) return null;

  return (
    <section aria-labelledby="trip-essentials-title">
      <h3
        id="trip-essentials-title"
        className="font-display text-lg font-semibold text-nexa-ink"
      >
        {t("inbox.phase14.essentials")}
      </h3>
      <dl className="mt-3 divide-y divide-nexa-line/60 rounded-2xl border border-nexa-line/70 bg-nexa-bg/65 px-4 shadow-messaging-1">
        {rows.map(({ id, label, value, Icon }) => (
          <div key={id} className="flex min-w-0 items-center gap-3 py-3">
            <Icon className="h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
            <dt className="text-xs font-semibold text-nexa-ink-3">{label}</dt>
            <dd className="ms-auto min-w-0 truncate text-end text-xs font-bold text-nexa-ink">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
