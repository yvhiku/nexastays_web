"use client";

import React from "react";
import { FileText } from "lucide-react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";

export function PaymentCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as { title?: string; body?: string; actions?: CardAction[] };
  const title = payload?.title ?? meta.title ?? "Payment";
  const body = payload?.body ?? meta.body;
  const actions = payload?.actions ?? meta.actions ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[92%] items-center gap-3 rounded-2xl border border-nexa-primary/15 bg-white px-4 py-3 shadow-nexa-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nexa-primary-soft">
        <FileText className="h-5 w-5 text-nexa-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-nexa-ink">{title}</p>
        {body ? <p className="text-xs text-nexa-ink-3">{body}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => executeCardAction(action, { localePath })}
            className="text-xs font-semibold text-nexa-primary hover:underline"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
