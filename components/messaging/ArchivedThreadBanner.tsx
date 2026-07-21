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
    <div className="mx-4 mb-3 rounded-2xl border border-nexa-line/60 bg-white px-4 py-4 text-center shadow-nexa-sm">
      <p className="text-sm font-semibold text-nexa-ink">{title}</p>
      <p className="mt-1 text-sm text-nexa-ink-3">{body}</p>
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
          className="inline-flex items-center rounded-full bg-nexa-primary px-4 py-2 text-sm font-semibold text-white"
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
            className="inline-flex items-center rounded-full border border-nexa-line px-4 py-2 text-sm font-semibold text-nexa-ink"
          >
            {viewReservationLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
