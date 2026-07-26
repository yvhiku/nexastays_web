"use client";

import React from "react";
import { KeyRound } from "lucide-react";

export function AccessPreview({
  title,
  availableLabel,
}: {
  title: string;
  availableLabel: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-nexa-primary/10 bg-nexa-primary-soft/60 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-nexa-primary shadow-sm">
        <KeyRound className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h4 className="text-sm font-semibold text-nexa-ink">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-nexa-ink-3">{availableLabel}</p>
      </div>
    </div>
  );
}
