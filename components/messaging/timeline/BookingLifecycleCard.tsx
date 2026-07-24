"use client";

import React from "react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  ConversationPresentation,
  MessageDto,
} from "@/lib/messaging/messages-api";
import { getCardPayload } from "@/lib/messaging/message-payload";
import {
  executeCardAction,
  type CardAction,
} from "@/lib/messaging/actions/registry";

type Props = {
  messages: MessageDto[];
  presentation: ConversationPresentation;
  localePath: (path: string) => string;
};

function actionsFrom(messages: MessageDto[]): CardAction[] {
  const actions = messages.flatMap((message) => {
    const payload = getCardPayload(message);
    const metadata = message.metadata as { actions?: CardAction[] };
    return payload?.actions ?? metadata.actions ?? [];
  });
  return Array.from(new Map(actions.map((action) => [action.id, action])).values());
}

function dateLabel(value: string, locale: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function BookingLifecycleCard({
  messages,
  presentation,
  localePath,
}: Props) {
  const { t, locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const reservation = presentation.reservation;
  const bookingId = reservation.bookingId;
  const sourceActions = actionsFrom(messages);
  const fallbackAction: CardAction | undefined = bookingId
    ? {
        id: "view_booking_timeline",
        label: t("inbox.context.viewBooking"),
        type: "OPEN_BOOKING",
        url: `/bookings/${bookingId}`,
      }
    : undefined;
  const viewBooking: CardAction | undefined =
    sourceActions.find((action) =>
      [action.id, action.type, action.url].some((value) =>
        typeof value === "string" && value.toLowerCase().includes("booking"),
      ),
    ) ?? fallbackAction;
  const time = messages[0]?.sentAt ?? messages[0]?.createdAt;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      className="mx-auto w-full max-w-[600px] rounded-[24px] border border-nexa-primary/15 bg-[linear-gradient(145deg,#fff,#fff9fa)] p-4 shadow-[0_7px_22px_rgba(92,42,65,0.07)] transition-shadow duration-150 hover:shadow-[0_11px_28px_rgba(92,42,65,0.10)] motion-reduce:transition-none sm:p-5"
      style={{ contentVisibility: "auto", containIntrinsicSize: "240px" }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-nexa-primary/15 bg-nexa-primary-soft text-nexa-primary shadow-sm">
          <CalendarCheck className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-6 text-nexa-ink md:text-lg">
            {t("inbox.timeline.bookingTitle")}
          </h3>
          {time ? (
            <p className="mt-2 text-[13px] font-medium text-nexa-ink-4">
              {new Date(time).toLocaleString(locale, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
          <p className="mt-3 text-[15px] leading-6 text-nexa-ink-2">
            {t("inbox.timeline.bookingBody")}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-nexa-primary/10 bg-white/80 p-4">
        <p className="font-display text-xl font-semibold leading-tight text-nexa-ink">
          {presentation.listing.title || reservation.listingTitle}
        </p>
        <div className="mt-4 text-sm text-nexa-ink-2">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <CalendarDays className="h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
            <span>{dateLabel(reservation.checkinDate, locale)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-nexa-ink-4 rtl:rotate-180" aria-hidden />
            <span>{dateLabel(reservation.checkoutDate, locale)}</span>
          </div>
        </div>
      </div>

      {viewBooking ? (
        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          onClick={() => executeCardAction(viewBooking, { localePath })}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-nexa-primary/15 bg-nexa-primary-soft px-4 text-sm font-semibold text-nexa-primary shadow-[0_3px_10px_rgba(232,80,122,0.08)] transition-[background-color,box-shadow] hover:bg-[#fbe3e9] hover:shadow-[0_5px_14px_rgba(232,80,122,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 lg:min-h-10"
        >
          {viewBooking.label}
          <ExternalLink className="h-4 w-4" aria-hidden />
        </motion.button>
      ) : null}
    </motion.article>
  );
}
