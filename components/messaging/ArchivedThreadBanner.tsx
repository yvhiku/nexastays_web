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
    <div className="mx-4 mb-3 rounded-3xl border border-nexa-primary/15 bg-[linear-gradient(145deg,#fff,#fdf1f4)] px-5 py-5 text-center shadow-[0_10px_28px_rgba(108,51,75,0.10)]">
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
          className="inline-flex min-h-11 items-center rounded-full border border-nexa-primary/20 bg-[linear-gradient(135deg,#f4809a,#e8507a_55%,#c93a62)] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(232,80,122,0.24)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(232,80,122,0.30)] active:scale-[0.98] motion-reduce:transition-none"
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
            className="inline-flex min-h-11 items-center rounded-full border border-nexa-primary/20 bg-white px-4 py-2 text-sm font-semibold text-nexa-primary shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-nexa-primary/35 hover:shadow-nexa-sm active:scale-[0.98] motion-reduce:transition-none"
          >
            {viewReservationLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
