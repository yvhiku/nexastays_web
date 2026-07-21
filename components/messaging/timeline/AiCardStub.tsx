"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { CardProps } from "./registry";

/** Reserved renderer for future Nexa Concierge AI messages. */
export function AiCardStub({ message }: CardProps) {
  const meta = message.metadata as { title?: string; body?: string };
  return (
    <div className="mx-auto w-full max-w-[92%] rounded-2xl border border-dashed border-nexa-primary/30 bg-nexa-primary-soft/20 px-4 py-4 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-nexa-primary" aria-hidden />
      <p className="mt-2 text-sm font-semibold text-nexa-ink">
        {meta.title ?? "Nexa Concierge"}
      </p>
      <p className="mt-1 text-xs text-nexa-ink-3">
        {meta.body ?? "AI-assisted messaging coming soon."}
      </p>
    </div>
  );
}
