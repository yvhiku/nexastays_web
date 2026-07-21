"use client";

import React from "react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";

function cardMeta(message: CardProps["message"]) {
  const payload = getCardPayload(message);
  return {
    title: payload?.title ?? (message.metadata as { title?: string }).title ?? "Check-in",
    body: payload?.body ?? (message.metadata as { body?: string }).body,
    actions: payload?.actions ?? (message.metadata as { actions?: CardAction[] }).actions ?? [],
    snapshot: payload?.snapshot ?? (message.metadata as { snapshot?: Record<string, unknown> }).snapshot,
  };
}

export function CheckinCard({ message, localePath }: CardProps) {
  const meta = cardMeta(message);
  const doorCode = meta.snapshot?.doorCode as string | undefined;
  const checkInTime = meta.snapshot?.checkInTime as string | undefined;

  return (
    <div className="mx-auto w-full max-w-[92%] rounded-2xl border border-nexa-primary/15 bg-white px-4 py-4 shadow-nexa-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-nexa-primary">Check-in</p>
      <p className="mt-1 text-base font-semibold text-nexa-ink">{meta.title}</p>
      {checkInTime ? <p className="mt-1 text-sm text-nexa-ink-3">{checkInTime}</p> : null}
      {doorCode ? (
        <div className="mt-3 rounded-xl bg-nexa-bg-2 px-3 py-2">
          <p className="text-xs text-nexa-ink-4">Door code</p>
          <p className="font-mono text-lg font-semibold text-nexa-ink">{doorCode}</p>
        </div>
      ) : null}
      {meta.body ? <p className="mt-2 text-sm text-nexa-ink-3">{meta.body}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {meta.actions.map((action) => (
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
  );
}
