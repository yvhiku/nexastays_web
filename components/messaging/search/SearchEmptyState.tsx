"use client";

import React from "react";
import { SearchX } from "lucide-react";

export function SearchEmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-messaging-card border border-nexa-line bg-white text-nexa-primary shadow-messaging-2">
        <SearchX className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold text-nexa-ink">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-nexa-ink-3">{body}</p>
    </div>
  );
}
