"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxFilter } from "@/lib/messaging/messages-api";

type Props = {
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  labels: {
    active: string;
    unread: string;
    support: string;
    archived: string;
    all: string;
    searchPlaceholder: string;
  };
};

const FILTERS: InboxFilter[] = ["active", "unread", "support", "archived", "all"];

export function InboxFilters({ filter, onFilterChange, query, onQueryChange, labels }: Props) {
  const labelFor = (f: InboxFilter) => {
    switch (f) {
      case "active":
        return labels.active;
      case "unread":
        return labels.unread;
      case "support":
        return labels.support;
      case "archived":
        return labels.archived;
      default:
        return labels.all;
    }
  };

  return (
    <div className="sticky top-0 z-layer-content bg-[rgba(255,252,253,0.94)] backdrop-blur-xl">
      <div className="px-4 pb-2 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexa-primary/70" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-9 w-full rounded-full border border-nexa-line/70 bg-white ps-9 pe-3 text-[13px] text-nexa-ink shadow-[0_3px_14px_rgba(85,45,65,0.055)] placeholder:text-nexa-ink-4 transition-shadow focus:border-nexa-primary/30 focus:outline-none focus:ring-2 focus:ring-nexa-primary/20"
            aria-label={labels.searchPlaceholder}
          />
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 motion-reduce:transition-none active:scale-95",
              filter === f
                ? "border-nexa-primary/25 bg-[linear-gradient(135deg,#fdf0f3,#fde5eb)] text-nexa-primary shadow-nexa-sm"
                : "border-transparent text-nexa-ink-3 hover:border-nexa-line hover:bg-white hover:text-nexa-primary hover:shadow-sm",
            )}
          >
            {labelFor(f)}
          </button>
        ))}
      </div>
    </div>
  );
}
