"use client";

import React from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  CircleX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingTimelineStatus } from "./BookingTimelineCard";

const STYLES: Record<BookingTimelineStatus, string> = {
  confirmed: "border-emerald-200/70 bg-emerald-50/80 text-emerald-800",
  pending: "border-amber-200/70 bg-amber-50/80 text-amber-800",
  cancelled: "border-red-200/70 bg-red-50/80 text-red-800",
  completed: "border-nexa-line bg-nexa-bg-2 text-nexa-ink-2",
  neutral: "border-nexa-line bg-nexa-bg-2 text-nexa-ink-2",
};

const ICONS = {
  confirmed: CheckCircle2,
  pending: CalendarClock,
  cancelled: CircleX,
  completed: CheckCircle2,
  neutral: Circle,
} satisfies Record<BookingTimelineStatus, React.ElementType>;

type Props = {
  status: BookingTimelineStatus;
  label: string;
  description?: string;
};

export function BookingStatusBanner({ status, label, description }: Props) {
  const Icon = ICONS[status];
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3 py-2",
        STYLES[status],
      )}
      role="status"
      aria-label={label}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-5">{label}</p>
        {description ? (
          <p className="text-xs leading-5 opacity-80">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
