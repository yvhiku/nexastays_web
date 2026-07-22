"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  skipLabel: string;
  continueLabel: string;
  onSkip: () => void;
  onContinue: () => void;
  className?: string;
  layout?: "stacked" | "split";
};

export function GuidanceDialogActions({
  skipLabel,
  continueLabel,
  onSkip,
  onContinue,
  className,
  layout = "split",
}: Props) {
  if (layout === "stacked") {
    return (
      <div className={cn("flex w-full flex-col gap-2", className)}>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-nexa-primary py-3.5 text-base font-semibold text-white shadow-lg shadow-nexa-primary/20 transition active:scale-[0.98]"
        >
          {continueLabel}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-base font-medium text-nexa-ink-4 transition hover:text-nexa-ink-3"
        >
          {skipLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-center justify-between gap-4", className)}>
      <button
        type="button"
        onClick={onSkip}
        className="px-1 py-2 text-sm font-medium text-nexa-ink-4 transition hover:text-nexa-ink-2"
      >
        {skipLabel}
      </button>
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex items-center gap-1 rounded-full bg-nexa-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-nexa-primary/15 transition hover:bg-nexa-primary-dark active:scale-[0.98]"
      >
        {continueLabel}
      </button>
    </div>
  );
}
