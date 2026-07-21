"use client";

import React, { useState } from "react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";

export function WifiCard({ message, localePath }: CardProps) {
  const payload = getCardPayload(message);
  const meta = message.metadata as { snapshot?: Record<string, unknown>; actions?: CardAction[] };
  const snapshot = payload?.snapshot ?? meta.snapshot ?? {};
  const ssid = String(snapshot.ssid ?? snapshot.wifiSsid ?? "Guest Network");
  const password = String(snapshot.password ?? snapshot.wifiPassword ?? "");
  const [revealed, setRevealed] = useState(false);

  const actions = payload?.actions ?? meta.actions ?? [];

  return (
    <div className="mx-auto w-full max-w-[92%] rounded-2xl border border-nexa-primary/15 bg-white px-4 py-4 shadow-nexa-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-nexa-primary">WiFi</p>
      <p className="mt-1 text-base font-semibold text-nexa-ink">{ssid}</p>
      {password ? (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="mt-3 block w-full rounded-xl bg-nexa-bg-2 px-3 py-2 text-left font-mono text-sm text-nexa-ink"
        >
          {revealed ? password : "••••••••"}
        </button>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {password ? (
          <button
            type="button"
            onClick={() => executeCardAction({ id: "copy_wifi", label: "Copy", type: "COPY", value: password }, { localePath })}
            className="inline-flex items-center rounded-full border border-nexa-primary px-3 py-1.5 text-xs font-semibold text-nexa-primary"
          >
            Copy password
          </button>
        ) : null}
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
  );
}
