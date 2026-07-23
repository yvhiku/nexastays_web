"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPresentation } from "@/lib/messaging/messages-api";
import { executeCardAction } from "@/lib/messaging/actions/registry";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  presentation: ConversationPresentation;
  collapsed?: boolean;
  localePath: (path: string) => string;
  messagingState?: string;
  postStayEndsAt?: string | null;
  bookingStatus?: string | null;
  canReview?: boolean;
};

function formatAvailableUntil(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
  });
}

/** Booking slice of conversation context — extensible for check-in, payment, support. */
export function ConversationContext({
  presentation,
  collapsed = false,
  localePath,
  messagingState,
  postStayEndsAt,
  bookingStatus,
  canReview = false,
}: Props) {
  const { t, tf, locale } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const bookingId = presentation.reservation.bookingId;
  const coverUrl = presentation.reservation.coverMedia?.url ?? null;
  const isPostStay =
    bookingStatus === "COMPLETED" &&
    messagingState === "ACTIVE" &&
    !!postStayEndsAt;
  const isArchived = messagingState === "ARCHIVED";

  if (collapsed) {
    return (
      <div className="max-h-0 overflow-hidden opacity-0 border-t-0" aria-hidden />
    );
  }

  return (
    <div
      className={cn(
        "border-t border-[#F7F7F7] bg-[#f6f3f2] transition-all duration-200 overflow-hidden",
        expanded ? "max-h-52" : "max-h-12",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2 mx-auto min-h-[40px] text-left lg:max-w-none"
      >
        <p className="flex-1 min-w-0 text-sm text-nexa-ink-3 truncate">
          {isPostStay
            ? t("inbox.stayCompleted")
            : (presentation.bookingChip ?? presentation.listing.title)}
        </p>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-nexa-ink-4" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-nexa-ink-4" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="flex items-start gap-3 px-4 pb-3 mx-auto lg:max-w-none">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0" />
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-nexa-ink truncate">{presentation.listing.title}</p>
            {isPostStay && postStayEndsAt ? (
              <p className="text-xs text-nexa-ink-3">
                {tf("inbox.conversationAvailableUntil", {
                  date: formatAvailableUntil(postStayEndsAt, locale),
                })}
              </p>
            ) : (
              <p className="text-xs text-nexa-ink-3 truncate">
                {presentation.reservation.checkinDate} – {presentation.reservation.checkoutDate}
                {presentation.reservation.guestCount
                  ? ` • ${presentation.reservation.guestCount} ${t("inbox.guests")}`
                  : null}
              </p>
            )}
          </div>
          {bookingId && isPostStay && canReview && !isArchived ? (
            <button
              type="button"
              onClick={() =>
                executeCardAction(
                  {
                    id: "leave_review",
                    label: t("inbox.leaveReview"),
                    type: "deep_link",
                    url: `/bookings/${bookingId}/review`,
                  },
                  { localePath },
                )
              }
              className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-nexa-primary hover:underline"
            >
              <Star className="h-3.5 w-3.5 fill-nexa-primary text-nexa-primary" aria-hidden />
              {t("inbox.leaveReview")}
            </button>
          ) : bookingId ? (
            <button
              type="button"
              onClick={() =>
                executeCardAction(
                  {
                    id: "view_booking",
                    label: t("inbox.viewBooking"),
                    type: "OPEN_BOOKING",
                    url: `/bookings/${bookingId}`,
                  },
                  { localePath },
                )
              }
              className="shrink-0 text-sm font-semibold text-nexa-primary hover:underline"
            >
              {t("inbox.viewBooking")} →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated use ConversationContext */
export const ReservationContextBar = ConversationContext;
