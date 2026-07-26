"use client";

import React from "react";
import {
  CheckCircle2,
  Clock3,
  Star,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PremiumStatusPill({
  label,
  status,
}: {
  label: string;
  status?: string | null;
}) {
  const normalized = `${status ?? ""} ${label}`.toLowerCase();
  const cancelled = /cancel|declin|failed/.test(normalized);
  const completed = /complete|checkout|finished/.test(normalized);
  const pending = /pending|await|inquiry/.test(normalized);
  const review = /review/.test(normalized);
  const Icon = cancelled
    ? XCircle
    : pending
      ? Clock3
      : review
        ? Star
        : CheckCircle2;
  return (
    <span
      className={cn(
        "inline-flex min-h-6 max-w-[150px] items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em]",
        cancelled
          ? "border-red-200 bg-red-50 text-red-700"
          : completed
            ? "border-slate-200 bg-slate-100 text-slate-700"
            : pending
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : review
                ? "border-nexa-primary/20 bg-nexa-primary-soft text-nexa-primary"
                : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
