"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import type { ContextModule } from "@/lib/messaging/context-panel";
import { executeCardAction } from "@/lib/messaging/actions/registry";
import { useLanguage } from "@/contexts/LanguageContext";

export function BookingQuickActions({
  modules,
}: {
  modules: ContextModule[];
}) {
  const { t, localePath } = useLanguage();
  const actions = modules
    .flatMap((module) => module.actions)
    .filter(
      (action, index, all) =>
        all.findIndex((candidate) => candidate.id === action.id) === index,
    )
    .slice(0, 3);
  if (!actions.length) return null;

  return (
    <section aria-labelledby="booking-quick-actions-title">
      <h3
        id="booking-quick-actions-title"
        className="font-display text-lg font-semibold text-nexa-ink"
      >
        {t("inbox.phase14.quickActions")}
      </h3>
      <div className="mt-3 grid gap-2">
        {actions.map((action, index) => (
          <button
            key={action.id}
            type="button"
            onClick={() => executeCardAction(action, { localePath })}
            className={
              index === 0
                ? "flex min-h-12 items-center justify-between rounded-full bg-[linear-gradient(145deg,#e8507a,#f06792)] px-4 text-start text-sm font-bold text-white shadow-messaging-2 transition-transform active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45"
                : "flex min-h-12 items-center justify-between rounded-full border border-nexa-line bg-white px-4 text-start text-sm font-bold text-nexa-ink-2 shadow-sm transition-[background-color,transform] hover:bg-nexa-bg active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45"
            }
          >
            {action.label}
            <ArrowUpRight className="h-4 w-4 shrink-0 rtl:-scale-x-100" aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
}
