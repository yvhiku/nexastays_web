"use client";

import React from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxFilter } from "@/lib/messaging/messages-api";

type Props = {
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  loading?: boolean;
  labels: {
    active: string;
    unread: string;
    support: string;
    archived: string;
    all: string;
    searchPlaceholder: string;
    clearSearch: string;
    loading: string;
  };
};

const FILTERS: InboxFilter[] = ["active", "unread", "support", "archived", "all"];

export function InboxFilters({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  loading = false,
  labels,
}: Props) {
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
    <div className="sticky top-0 z-layer-content bg-[rgba(255,252,253,0.94)] pb-2 backdrop-blur-xl">
      <div className="px-4 pb-2 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 stroke-[1.75] text-nexa-ink-4" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-12 w-full rounded-messaging-search border border-nexa-line bg-white ps-12 pe-12 text-sm text-nexa-ink shadow-messaging-1 placeholder:text-nexa-ink-4 transition-[border-color,box-shadow] duration-messaging-hover focus:border-nexa-primary/40 focus:outline-none focus:ring-2 focus:ring-nexa-primary/20"
            aria-label={labels.searchPlaceholder}
          />
          {loading ? (
            <span
              className="absolute end-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-nexa-ink-4"
              role="status"
              aria-label={labels.loading}
            >
              <LoaderCircle
                className="h-5 w-5 animate-spin stroke-[1.75] motion-reduce:animate-none"
                aria-hidden
              />
            </span>
          ) : query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute end-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-nexa-ink-4 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
              aria-label={labels.clearSearch}
            >
              <X className="h-5 w-5 stroke-[1.75]" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <div
        className="mx-4 flex flex-wrap gap-1 rounded-messaging-dropdown border border-nexa-line bg-nexa-bg-2/55 p-1"
        aria-label={labels.searchPlaceholder}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            aria-pressed={filter === f}
            className={cn(
              "min-h-12 shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-messaging-hover motion-reduce:transition-none active:scale-95 active:duration-messaging-press lg:min-h-10",
              filter === f
                ? "border-nexa-primary/20 bg-nexa-primary text-white shadow-messaging-1"
                : "border-transparent text-nexa-ink-3 hover:bg-white hover:text-nexa-ink",
            )}
          >
            {labelFor(f)}
          </button>
        ))}
      </div>
    </div>
  );
}
