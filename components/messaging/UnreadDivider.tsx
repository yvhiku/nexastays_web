"use client";

import React from "react";

export function UnreadDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 px-4" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-nexa-primary/25" aria-hidden />
      <span className="rounded-full bg-nexa-primary-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-nexa-primary">{label}</span>
      <span className="h-px flex-1 bg-nexa-primary/25" aria-hidden />
    </div>
  );
}
