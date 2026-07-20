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
    all: string;
    unread: string;
    hosts: string;
    support: string;
    searchPlaceholder: string;
  };
};

const FILTERS: InboxFilter[] = ["all", "unread", "hosts", "support"];

export function InboxFilters({ filter, onFilterChange, query, onQueryChange, labels }: Props) {
  const labelFor = (f: InboxFilter) => {
    switch (f) {
      case "unread":
        return labels.unread;
      case "hosts":
        return labels.hosts;
      case "support":
        return labels.support;
      default:
        return labels.all;
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-[rgba(253,251,252,0.95)] backdrop-blur-md border-b border-nexa-line/60">
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nexa-ink-4 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full h-10 ps-9 pe-3 rounded-xl bg-nexa-bg-2 border border-nexa-line/60 text-sm text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/30"
            aria-label={labels.searchPlaceholder}
          />
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filter === f
                ? "bg-nexa-primary text-white shadow-sm"
                : "bg-nexa-bg-2 text-nexa-ink-3 hover:bg-nexa-primary-soft hover:text-nexa-primary",
            )}
          >
            {labelFor(f)}
          </button>
        ))}
      </div>
    </div>
  );
}
