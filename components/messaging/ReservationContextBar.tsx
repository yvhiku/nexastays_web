"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ConversationPresentation } from "@/lib/messaging/messages-api";
import { executeCardAction } from "@/lib/messaging/actions/registry";

type Props = {
  presentation: ConversationPresentation;
  collapsed?: boolean;
  localePath: (path: string) => string;
};

export function ReservationContextBar({
  presentation,
  collapsed = false,
  localePath,
}: Props) {
  const bookingId = presentation.reservation.bookingId;

  return (
    <div
      className={cn(
        "border-t border-[#F7F7F7] bg-[#f6f3f2] transition-all duration-200 overflow-hidden",
        collapsed ? "max-h-0 opacity-0 border-t-0" : "max-h-16 opacity-100",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 max-w-2xl mx-auto w-full min-h-[40px]">
        <p className="flex-1 min-w-0 text-sm text-nexa-ink-3 truncate">
          <span className="font-semibold text-nexa-ink">{presentation.listing.title}</span>
          {presentation.reservation.checkinDate && presentation.reservation.checkoutDate ? (
            <>
              <span className="text-nexa-ink-4 mx-1.5">•</span>
              <span>
                {formatShortRange(
                  presentation.reservation.checkinDate,
                  presentation.reservation.checkoutDate,
                )}
              </span>
            </>
          ) : null}
          {presentation.reservation.guestCount ? (
            <>
              <span className="text-nexa-ink-4 mx-1.5">•</span>
              <span>{presentation.reservation.guestCount} guests</span>
            </>
          ) : null}
        </p>
        {bookingId ? (
          <button
            type="button"
            onClick={() =>
              executeCardAction(
                {
                  id: "view_booking",
                  label: "View booking",
                  type: "deep_link",
                  url: `/bookings/${bookingId}`,
                },
                { localePath },
              )
            }
            className="shrink-0 text-sm font-semibold text-nexa-primary hover:underline"
          >
            View booking
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatShortRange(checkin: string, checkout: string): string {
  const inDate = new Date(checkin);
  const outDate = new Date(checkout);
  const sameMonth = inDate.getMonth() === outDate.getMonth();
  const d1 = inDate.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const d2 = outDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });
  return `${d1}–${d2}`;
}
