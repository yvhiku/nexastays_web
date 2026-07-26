"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { SearchResultType } from "@/lib/messaging/messages-api";

export type SearchFilter = SearchResultType | "all";

export function SearchFilterChips({
  filters,
  selected,
  labels,
  onChange,
}: {
  filters: SearchFilter[];
  selected: SearchFilter;
  labels: Record<SearchFilter, string>;
  onChange: (filter: SearchFilter) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {filters.map((filter) => {
        const active = selected === filter;
        return (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter)}
            className={`relative min-h-11 overflow-hidden rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 ${
              active
                ? "border-nexa-primary/20 text-white"
                : "border-nexa-line bg-white text-nexa-ink-3 hover:border-nexa-primary/20 hover:text-nexa-primary"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="search-active-filter"
                className="absolute inset-0 bg-[linear-gradient(135deg,#f4809a,#e8507a)]"
                transition={{ duration: reduceMotion ? 0 : 0.15 }}
                aria-hidden
              />
            ) : null}
            <span className="relative">{labels[filter]}</span>
          </button>
        );
      })}
    </div>
  );
}
