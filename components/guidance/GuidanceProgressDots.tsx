"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  step: number;
  total: number;
  className?: string;
  label?: string;
};

export function GuidanceProgressDots({ step, total, className, label }: Props) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={label}
    >
      {Array.from({ length: total }, (_, i) => {
        const active = i + 1 === step;
        return (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-[250ms]",
              active ? "bg-nexa-primary" : "bg-nexa-line",
            )}
          />
        );
      })}
    </div>
  );
}
