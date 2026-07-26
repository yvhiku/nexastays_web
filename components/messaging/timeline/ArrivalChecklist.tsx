"use client";

import React from "react";
import { Check, Circle } from "lucide-react";

export type ArrivalChecklistItem = {
  label: string;
  complete: boolean;
};

export function ArrivalChecklist({
  label,
  items,
}: {
  label: string;
  items: ArrivalChecklistItem[];
}) {
  return (
    <ol className="space-y-2.5" aria-label={label}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5 text-sm">
          {item.complete ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nexa-primary-soft text-nexa-primary">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
          ) : (
            <Circle className="h-5 w-5 text-nexa-line" aria-hidden />
          )}
          <span className={item.complete ? "font-medium text-nexa-ink-2" : "text-nexa-ink-4"}>
            {item.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
