"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  labels: string[];
  currentStep: number;
  ariaLabel: string;
};

export function BookingProgress({ labels, currentStep, ariaLabel }: Props) {
  return (
    <ol className="grid grid-cols-4" aria-label={ariaLabel}>
      {labels.map((label, index) => {
        const complete = index < currentStep;
        const current = index === currentStep;
        return (
          <li key={label} className="relative min-w-0 text-center">
            {index > 0 ? (
              <span
                className={cn(
                  "absolute end-1/2 top-[5px] h-px w-full",
                  index <= currentStep ? "bg-nexa-primary/55" : "bg-nexa-line",
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative mx-auto block h-[11px] w-[11px] rounded-full border-2 bg-white",
                complete && "border-nexa-primary bg-nexa-primary",
                current && "border-nexa-primary shadow-[0_0_0_3px_rgba(232,80,122,0.12)]",
                !complete && !current && "border-nexa-line",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "mt-2 block truncate px-1 text-[10px] font-semibold",
                current || complete ? "text-nexa-ink-2" : "text-nexa-ink-4",
              )}
              aria-current={current ? "step" : undefined}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
