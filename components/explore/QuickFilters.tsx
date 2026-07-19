"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EXPLORE_QUICK_FILTERS } from "@/lib/explore-quick-filters";

export type QuickFiltersState = {
  verified: boolean;
  instant: boolean;
  listingType: string;
};

export type QuickFiltersProps = {
  state: QuickFiltersState;
  onToggle: (id: string) => void;
  t: (key: string) => string;
  className?: string;
};

function isActive(id: string, state: QuickFiltersState): boolean {
  if (id === "instant") return state.instant;
  if (id === "verified") return state.verified;
  if (id === "riads") return state.listingType === "RIAD";
  if (id === "apartments") return state.listingType === "APARTMENT";
  if (id === "villas") return state.listingType === "VILLA";
  return false;
}

export function QuickFilters({
  state,
  onToggle,
  t,
  className,
}: QuickFiltersProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2 min-w-0", className)}
      role="group"
      aria-label={t("explore.quickFilters")}
    >
      {EXPLORE_QUICK_FILTERS.map((f) => {
        const active = isActive(f.id, state);
        return (
          <button
            type="button"
            key={f.id}
            aria-pressed={active}
            onClick={() => onToggle(f.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors",
              active
                ? "border-nexa-primary bg-nexa-primary text-white shadow-sm"
                : "border-nexa-line bg-white text-nexa-ink-2 hover:border-nexa-primary hover:text-nexa-primary",
            )}
          >
            {t(f.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
