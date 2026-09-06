"use client";

import { AlertCircle, AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared status vocabulary for the listing wizard. One shape + color pairing
 * reused by sidebar steps, footer save state, and the submit checklist so a
 * host never learns three visual languages for "this needs attention".
 *
 * Color alone never encodes status: every role has a distinct icon.
 * Red is reserved for `error` (invalid field, failed upload, failed save).
 */
export type WizardStatus = "ok" | "current" | "needsAttention" | "error" | "busy";

export type WizardStatusTone = "light" | "dark";

const TEXT: Record<WizardStatusTone, Record<WizardStatus, string>> = {
  light: {
    ok: "text-nexa-primary",
    current: "text-nexa-primary",
    needsAttention: "text-nexa-accent",
    error: "text-red-600",
    busy: "text-nexa-ink-3",
  },
  dark: {
    ok: "text-white",
    current: "text-white",
    needsAttention: "text-nexa-accent",
    error: "text-red-300",
    busy: "text-white/70",
  },
};

/** Circular badge treatment used by the stepper. */
const BADGE: Record<WizardStatusTone, Record<WizardStatus, string>> = {
  light: {
    ok: "border-nexa-primary bg-nexa-primary text-white",
    current: "border-nexa-primary bg-nexa-primary/15 text-nexa-primary",
    needsAttention: "border-nexa-accent/70 bg-nexa-accent-soft text-nexa-accent",
    error: "border-red-500 bg-red-50 text-red-600",
    busy: "border-nexa-line bg-white text-nexa-ink-3",
  },
  dark: {
    ok: "border-nexa-primary bg-nexa-primary text-white",
    current: "border-nexa-primary bg-nexa-primary/25 text-white",
    needsAttention: "border-nexa-accent/60 bg-nexa-accent/10 text-nexa-accent",
    error: "border-red-400 bg-red-500/15 text-red-200",
    busy: "border-white/20 text-white/60",
  },
};

export function wizardStatusClasses(
  status: WizardStatus,
  tone: WizardStatusTone = "light",
): { text: string; badge: string } {
  return { text: TEXT[tone][status], badge: BADGE[tone][status] };
}

export function WizardStatusIcon({
  status,
  className,
  size = 14,
  label,
}: {
  status: WizardStatus;
  className?: string;
  size?: number;
  /** Accessible name when the icon stands alone; omit when next to visible text. */
  label?: string;
}) {
  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };
  const common = { size, strokeWidth: 2.25, className };
  switch (status) {
    case "ok":
      return <Check {...common} {...a11y} />;
    case "needsAttention":
      return <AlertTriangle {...common} {...a11y} />;
    case "error":
      return <AlertCircle {...common} {...a11y} />;
    case "busy":
      return <Loader2 {...common} {...a11y} className={cn("animate-spin", className)} />;
    case "current":
    default:
      return (
        <span
          {...a11y}
          className={cn("block rounded-full bg-current", className)}
          style={{ width: size / 2, height: size / 2 }}
        />
      );
  }
}

/** Numbered / iconed circle for the stepper. */
export function WizardStatusBadge({
  status,
  index,
  tone = "light",
  className,
}: {
  status: WizardStatus;
  /** 1-based step number shown for `current` / `needsAttention`. */
  index: number;
  tone?: WizardStatusTone;
  className?: string;
}) {
  const { badge } = wizardStatusClasses(status, tone);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.78rem] font-bold tabular-nums transition-colors duration-150",
        badge,
        className,
      )}
    >
      {status === "ok" ? <Check size={14} strokeWidth={2.5} /> : index}
    </span>
  );
}
