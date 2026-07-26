"use client";

import React from "react";
import { ArrowUpRight, Home } from "lucide-react";

export type ReservationAction = {
  id: string;
  label: string;
  onSelect: () => void;
};

type Props = {
  title: string;
  dates?: string | null;
  status?: string | null;
  actions: ReservationAction[];
};

export function PinnedPropertyCard({ title, dates, status, actions }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-messaging-dropdown border border-nexa-line bg-white p-3 shadow-messaging-1 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nexa-primary-soft text-nexa-primary">
        <Home className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-nexa-ink">{title}</p>
        <p className="mt-0.5 truncate text-xs text-nexa-ink-3">
          {[dates, status].filter(Boolean).join(" · ")}
        </p>
      </div>
      {actions.length ? (
        <div className="flex min-w-0 flex-wrap gap-1 sm:justify-end">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onSelect}
              className="group inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-nexa-primary transition-colors hover:bg-nexa-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
            >
              {action.label}
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-px group-hover:translate-x-px rtl:-scale-x-100" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
