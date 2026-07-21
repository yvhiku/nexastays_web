"use client";

import React from "react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import type { CardProps } from "./registry";

export function BookingCard({ message, localePath }: CardProps) {
  const meta = message.metadata as {
    title?: string;
    body?: string;
    actions?: CardAction[];
  };
  const title = meta.title ?? "Booking";
  const body = meta.body;

  return (
    <div className="mx-auto w-full max-w-[92%] rounded-2xl border border-nexa-primary/15 bg-white px-4 py-3 shadow-nexa-sm">
      <p className="text-sm font-semibold text-nexa-ink">{title}</p>
      {body ? <p className="mt-1 text-sm text-nexa-ink-3">{body}</p> : null}
      {meta.actions && meta.actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {meta.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => executeCardAction(action, { localePath })}
              className="inline-flex items-center rounded-full bg-nexa-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
