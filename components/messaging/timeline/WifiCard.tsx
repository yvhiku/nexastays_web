"use client";

import React, { useState } from "react";
import { Copy, Eye, EyeOff, Wifi } from "lucide-react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CardProps } from "./registry";

export function WifiCard({ message, localePath }: CardProps) {
  const { t } = useLanguage();
  const payload = getCardPayload(message);
  const meta = message.metadata as {
    title?: string;
    snapshot?: Record<string, unknown>;
    actions?: CardAction[];
  };
  const snapshot = payload?.snapshot ?? meta.snapshot ?? {};
  const rawSsid = snapshot.ssid ?? snapshot.wifiSsid;
  const rawPassword = snapshot.password ?? snapshot.wifiPassword;
  const ssid = typeof rawSsid === "string" && rawSsid.trim() ? rawSsid : null;
  const password =
    typeof rawPassword === "string" && rawPassword.trim() ? rawPassword : null;
  const actions = payload?.actions ?? meta.actions ?? [];
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-xl items-center gap-2 py-0.5">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-nexa-primary/25" aria-hidden />
      <div className="flex max-w-[78%] items-center gap-1.5 text-center">
        <Wifi className="h-3.5 w-3.5 shrink-0 text-nexa-primary drop-shadow-[0_2px_4px_rgba(232,80,122,0.18)]" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-nexa-ink-2">
            {payload?.title ?? meta.title ?? t("inbox.wifi")}
          </p>
          {ssid ? <p className="truncate text-[10px] text-nexa-ink-4">{ssid}</p> : null}
          {password ? (
            <div className="mt-1 flex items-center justify-center gap-1">
              <code className="max-w-28 truncate text-[10px] text-nexa-ink-4">
                {revealed ? password : "••••••••"}
              </code>
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                className="rounded-md p-1 text-nexa-ink-4 hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
                aria-label={revealed ? t("inbox.hideWifiPassword") : t("inbox.showWifiPassword")}
              >
                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(password)}
                className="rounded-md p-1 text-nexa-ink-4 hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
                aria-label={t("inbox.copyWifiPassword")}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          {actions[0] ? (
            <button
              type="button"
              onClick={() => executeCardAction(actions[0], { localePath })}
              className="rounded-full bg-nexa-primary-soft px-2 py-0.5 text-[11px] font-semibold text-nexa-primary shadow-[0_2px_7px_rgba(232,80,122,0.08)] transition-[background-color,transform] hover:bg-[#fbe3e9] active:scale-95 motion-reduce:transition-none"
            >
              {actions[0].label}
            </button>
          ) : null}
        </div>
      </div>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-nexa-primary/25" aria-hidden />
    </div>
  );
}
