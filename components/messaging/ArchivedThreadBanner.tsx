"use client";

import React from "react";
import { executeCardAction } from "@/lib/messaging/actions/registry";

type Props = {
  bookingId: string | null;
  localePath: (path: string) => string;
  title: string;
  body: string;
  contactSupportLabel: string;
  viewReservationLabel: string;
};

export function ArchivedThreadBanner({
  bookingId,
  localePath,
  title,
  body,
  contactSupportLabel,
  viewReservationLabel,
}: Props) {
  return (
    <div className="mx-4 mb-3 rounded-messaging-panel border border-nexa-line bg-white px-5 py-5 text-center shadow-messaging-2">
      <p className="font-display text-base font-semibold text-nexa-ink">{title}</p>
      <p className="mt-1.5 text-sm text-nexa-ink-2">{body}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() =>
            executeCardAction(
              {
                id: "contact_support",
                label: contactSupportLabel,
                type: "deep_link",
                url: "/contact?safety=1",
              },
              { localePath },
            )
          }
          className="inline-flex min-h-12 items-center rounded-full border border-nexa-primary/20 bg-[linear-gradient(145deg,#e8507a,#f06792)] px-4 py-2 text-sm font-semibold text-white shadow-messaging-2 transition-[box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:shadow-messaging-3 active:scale-[0.98] active:duration-messaging-press motion-reduce:transition-none lg:min-h-10"
        >
          {contactSupportLabel}
        </button>
        {bookingId ? (
          <button
            type="button"
            onClick={() =>
              executeCardAction(
                {
                  id: "view_booking",
                  label: viewReservationLabel,
                  type: "deep_link",
                  url: `/bookings/${bookingId}`,
                },
                { localePath },
              )
            }
            className="inline-flex min-h-12 items-center rounded-full border border-nexa-line bg-white px-4 py-2 text-sm font-semibold text-nexa-ink-2 shadow-messaging-1 transition-[background-color,box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:bg-nexa-bg-2 hover:text-nexa-ink hover:shadow-messaging-2 active:scale-[0.98] active:duration-messaging-press motion-reduce:transition-none lg:min-h-10"
          >
            {viewReservationLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
