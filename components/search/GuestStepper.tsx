"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuestStepperProps = {
  label: string;
  subtitle: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  className?: string;
};

export function GuestStepper({
  label,
  subtitle,
  value,
  min = 0,
  max = 16,
  onChange,
  className,
}: GuestStepperProps) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-4 border-b border-nexa-line last:border-b-0",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-nexa-ink">{label}</p>
        <p className="text-xs text-nexa-ink-4 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={decDisabled}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={cn(
            "h-10 w-10 rounded-full border border-nexa-line flex items-center justify-center transition-colors",
            "hover:bg-nexa-primary-soft hover:border-nexa-primary hover:text-nexa-primary",
            "disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-nexa-line disabled:hover:text-inherit",
          )}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-nexa-ink">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={incDisabled}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={cn(
            "h-10 w-10 rounded-full border border-nexa-line flex items-center justify-center transition-colors",
            "hover:bg-nexa-primary-soft hover:border-nexa-primary hover:text-nexa-primary",
            "active:bg-nexa-primary active:text-white active:border-nexa-primary",
            "disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-nexa-line disabled:hover:text-inherit",
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
