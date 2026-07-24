"use client";

import React, { useState } from "react";
import { ArrowRight, Copy, Eye, EyeOff, Wifi } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  executeCardAction,
  type CardAction,
} from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CardProps } from "./registry";

export function WifiCard({ message, localePath }: CardProps) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
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
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      className="mx-auto w-full max-w-[560px] rounded-[24px] border border-sky-200/70 bg-[linear-gradient(145deg,#fff,#f6fbff)] p-4 shadow-[0_7px_22px_rgba(40,116,166,0.07)] transition-shadow duration-150 hover:shadow-[0_11px_28px_rgba(40,116,166,0.10)] motion-reduce:transition-none sm:p-5"
      style={{ contentVisibility: "auto", containIntrinsicSize: "180px" }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 shadow-sm">
          <Wifi className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-6 text-nexa-ink md:text-lg">
            {payload?.title ?? meta.title ?? t("inbox.wifi")}
          </h3>
          {ssid ? (
            <p className="mt-2 truncate text-[13px] font-medium text-nexa-ink-3">
              {ssid}
            </p>
          ) : null}
          {password ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-sky-100 bg-white/85 p-2.5 shadow-sm">
              <code className="min-w-0 flex-1 truncate px-1 text-sm font-semibold tracking-[0.12em] text-nexa-ink">
                {revealed ? password : "••••••••"}
              </code>
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sky-700 transition-[background-color,transform] hover:bg-sky-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 lg:h-9 lg:w-9"
                aria-label={
                  revealed
                    ? t("inbox.hideWifiPassword")
                    : t("inbox.showWifiPassword")
                }
              >
                {revealed ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(password)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sky-700 transition-[background-color,transform] hover:bg-sky-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 lg:h-9 lg:w-9"
                aria-label={t("inbox.copyWifiPassword")}
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
          {actions[0] ? (
            <motion.button
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => executeCardAction(actions[0], { localePath })}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-700 shadow-sm transition-[background-color,box-shadow] hover:bg-sky-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 lg:min-h-10"
            >
              {actions[0].label}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
