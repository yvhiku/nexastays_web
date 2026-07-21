"use client";

import React from "react";
import { Star } from "lucide-react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";

export function ReviewCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as {
    title?: string;
    body?: string;
    actions?: CardAction[];
    reviewed?: boolean;
  };
  const reviewed = meta.reviewed === true;
  const title = payload?.title ?? meta.title ?? "Hope you enjoyed your stay!";
  const body = payload?.body ?? meta.body;
  const actions = reviewed ? [] : (payload?.actions ?? meta.actions ?? []);

  return (
    <div className="mx-auto w-full max-w-[92%] rounded-2xl border border-nexa-primary/15 bg-white px-4 py-4 shadow-nexa-sm text-center">
      <div className="mx-auto mb-2 flex justify-center gap-0.5 text-nexa-primary">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
        ))}
      </div>
      <p className="text-base font-semibold text-nexa-ink">{title}</p>
      {body ? <p className="mt-1 text-sm text-nexa-ink-3">{body}</p> : null}
      {reviewed ? (
        <p className="mt-2 text-sm font-medium text-nexa-primary">✓</p>
      ) : null}
      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => executeCardAction(action, { localePath })}
              className="inline-flex items-center rounded-full bg-nexa-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
