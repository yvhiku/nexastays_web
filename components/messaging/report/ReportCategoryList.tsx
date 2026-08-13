"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  label: string;
};

type Props = {
  items: Item[];
  value: string | null;
  onChange: (id: string) => void;
  name: string;
};

export function ReportCategoryList({ items, value, onChange, name }: Props) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={name}>
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <label
            key={item.id}
            className={cn(
              "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-[border-color,background-color,box-shadow] duration-150",
              selected
                ? "border-nexa-primary/40 bg-nexa-primary-soft/40 shadow-messaging-1"
                : "border-nexa-line bg-white hover:border-nexa-primary/25 hover:bg-nexa-bg-2/60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={item.id}
              checked={selected}
              onChange={() => onChange(item.id)}
              className="mt-1 h-4 w-4 shrink-0 accent-nexa-primary"
            />
            <span className="text-sm font-medium leading-snug text-nexa-ink">
              {item.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
