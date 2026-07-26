"use client";

import React from "react";
import { Clock3, X } from "lucide-react";

export function RecentSearches({
  items,
  title,
  clearLabel,
  onSelect,
  onClear,
}: {
  items: string[];
  title: string;
  clearLabel: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-nexa-ink-4">{title}</h3>
        <button type="button" onClick={onClear} className="inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-xs font-semibold text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40">
          <X className="h-3.5 w-3.5" aria-hidden />{clearLabel}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item} type="button" onClick={() => onSelect(item)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-nexa-line bg-white px-3 text-xs font-medium text-nexa-ink-3 hover:border-nexa-primary/20 hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />{item}
          </button>
        ))}
      </div>
    </section>
  );
}
