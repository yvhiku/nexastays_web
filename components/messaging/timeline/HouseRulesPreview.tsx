"use client";

import React from "react";
import { House } from "lucide-react";

export function HouseRulesPreview({
  title,
  rules,
}: {
  title: string;
  rules: string[];
}) {
  if (rules.length === 0) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nexa-bg-2 text-nexa-primary">
        <House className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-nexa-ink">{title}</h4>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-nexa-ink-3">
          {rules.slice(0, 3).map((rule) => (
            <li key={rule} className="before:me-2 before:text-nexa-primary before:content-['•']">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
