"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { SearchActiveStep } from "./SearchState";

type Props = {
  step: Exclude<SearchActiveStep, null>;
  className?: string;
};

const ORDER: Exclude<SearchActiveStep, null>[] = ["destination", "dates", "guests"];

export function SearchProgress({ step, className }: Props) {
  const idx = ORDER.indexOf(step);
  return (
    <div
      className={cn("mb-3 flex items-center justify-center gap-0", className)}
      aria-hidden
    >
      {ORDER.map((id, i) => {
        const filled = i <= idx;
        return (
          <React.Fragment key={id}>
            {i > 0 ? (
              <span
                className={cn(
                  "h-px w-6",
                  i <= idx ? "bg-nexa-primary" : "bg-nexa-line",
                )}
              />
            ) : null}
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                filled ? "bg-nexa-primary" : "bg-nexa-line",
              )}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
