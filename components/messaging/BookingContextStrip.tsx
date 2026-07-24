"use client";

import React from "react";
import { CalendarDays, Info, ExternalLink } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { executeCardAction } from "@/lib/messaging/actions/registry";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  conversation: ConversationDetail;
  onOpenContext: () => void;
};

function compactDate(value: string, locale: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function BookingContextStrip({
  conversation,
  onOpenContext,
}: Props) {
  const { t, locale, localePath } = useLanguage();
  const reservation = conversation.presentation.reservation;
  const bookingId =
    reservation.bookingId ?? conversation.conversation.bookingId;

  return (
    <div className="mx-2 mb-3 flex min-h-12 min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-nexa-primary/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(253,240,243,0.88))] px-3 py-2.5 shadow-[0_8px_24px_rgba(135,60,91,0.09)] backdrop-blur-lg sm:mx-3 sm:gap-3 sm:px-4">
      <CalendarDays className="box-content hidden h-4 w-4 shrink-0 rounded-xl bg-nexa-primary-soft p-2 text-nexa-primary shadow-[inset_0_0_0_1px_rgba(232,80,122,0.10)] sm:block" />
      <div className="min-w-[min(100%,10rem)] flex-1">
        <p className="truncate font-display text-[15px] font-semibold leading-tight text-nexa-ink">
          {conversation.presentation.listing.title}
        </p>
        <p className="mt-1 truncate text-[11px] font-medium text-nexa-ink-3">
          {compactDate(reservation.checkinDate, locale)} –{" "}
          {compactDate(reservation.checkoutDate, locale)}
          {conversation.presentation.statusChip
            ? ` · ${conversation.presentation.statusChip}`
            : ""}
        </p>
      </div>
      {bookingId ? (
        <button
          type="button"
          onClick={() =>
            executeCardAction(
              {
                id: "view_booking_strip",
                label: t("inbox.context.viewBooking"),
                type: "OPEN_BOOKING",
                url: `/bookings/${bookingId}`,
              },
              { localePath },
            )
          }
          className="hidden min-h-11 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#f4809a,#e8507a_55%,#c93a62)] px-4 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(232,80,122,0.24)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(232,80,122,0.30)] active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none sm:inline-flex lg:min-h-10"
        >
          {t("inbox.context.viewBooking")}
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onOpenContext}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-nexa-primary/20 bg-white/75 px-3 text-xs font-semibold text-nexa-primary shadow-sm transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-nexa-primary/35 hover:bg-white hover:shadow-nexa-sm active:translate-y-0 motion-reduce:transition-none lg:min-h-10"
        aria-label={t("inbox.context.open")}
      >
        <Info className="h-4 w-4" />
        <span className="hidden md:inline">{t("inbox.context.details")}</span>
      </button>
    </div>
  );
}
