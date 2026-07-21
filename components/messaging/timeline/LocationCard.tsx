"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";

export function LocationCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as { title?: string; body?: string; actions?: CardAction[] };
  const title = payload?.title ?? meta.title ?? "Location";
  const body = payload?.body ?? meta.body;
  const actions = payload?.actions ?? meta.actions ?? [];

  return (
    <div className="mx-auto w-full max-w-[92%] overflow-hidden rounded-2xl border border-nexa-primary/15 bg-white shadow-nexa-sm">
      <div className="flex h-28 items-center justify-center bg-nexa-bg-2">
        <MapPin className="h-10 w-10 text-nexa-primary" aria-hidden />
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-nexa-ink">{title}</p>
        {body ? <p className="mt-1 text-sm text-nexa-ink-3">{body}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => executeCardAction(action, { localePath })}
              className="inline-flex items-center rounded-full bg-nexa-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
