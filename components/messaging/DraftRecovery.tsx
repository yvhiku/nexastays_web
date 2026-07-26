"use client";

import React from "react";
import { FilePenLine, X } from "lucide-react";

export function DraftRecovery({
  visible,
  label,
  body,
  dismissLabel,
  onContinue,
  onDismiss,
}: {
  visible: boolean;
  label: string;
  body: string;
  dismissLabel: string;
  onContinue: () => void;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="mx-4 mb-1 flex items-center gap-2 rounded-xl border border-nexa-primary/15 bg-nexa-primary-soft px-3 py-2">
      <FilePenLine className="h-4 w-4 shrink-0 text-nexa-primary" aria-hidden />
      <button type="button" onClick={onContinue} className="min-w-0 flex-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40">
        <span className="block text-xs font-semibold text-nexa-primary">{label}</span>
        <span className="block truncate text-xs text-nexa-ink-3">{body}</span>
      </button>
      <button type="button" onClick={onDismiss} className="flex h-10 w-10 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40" aria-label={dismissLabel}>
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
