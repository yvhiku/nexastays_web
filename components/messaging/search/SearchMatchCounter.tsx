"use client";

import React from "react";

export function SearchMatchCounter({
  query,
  count,
  label,
}: {
  query: string;
  count: number;
  label: string;
}) {
  if (!query.trim()) return null;
  return (
    <p className="text-xs font-medium text-nexa-ink-3" role="status" aria-live="polite">
      <span className="font-semibold text-nexa-ink">“{query.trim()}”</span>{" "}
      {label.replace("{count}", String(count))}
    </p>
  );
}
