"use client";

import React from "react";
import { CalendarDays, Clock3 } from "lucide-react";

type Props = {
  heading: string;
  date?: string | null;
  time?: string | null;
  timezone?: string | null;
};

export function ArrivalSummary({ heading, date, time, timezone }: Props) {
  if (!date && !time && !timezone) return null;
  return (
    <div className="grid gap-3 rounded-2xl border border-nexa-line/80 bg-nexa-bg/70 p-4 sm:grid-cols-2">
      {date ? (
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 h-4 w-4 text-nexa-primary" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-nexa-ink-4">
              {heading}
            </p>
            <time className="text-sm font-semibold text-nexa-ink-2">{date}</time>
          </div>
        </div>
      ) : null}
      {time || timezone ? (
        <div className="flex items-start gap-2.5">
          <Clock3 className="mt-0.5 h-4 w-4 text-nexa-primary" aria-hidden />
          <p className="text-sm font-medium leading-5 text-nexa-ink-2">
            {[time, timezone].filter(Boolean).join(" · ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
