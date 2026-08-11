import React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  /** Dot indicator when true */
  pulse?: boolean;
};

const TONE: Record<Tone, string> = {
  neutral:
    "bg-[color:var(--host-background)] text-[color:var(--host-text-secondary)] border-[color:var(--host-border)]",
  success: "bg-emerald-50 text-emerald-800 border-emerald-100",
  warning: "bg-amber-50 text-amber-800 border-amber-100",
  danger: "bg-red-50 text-red-800 border-red-100",
  primary:
    "bg-[color:var(--host-primary-soft)] text-[color:var(--host-primary)] border-[color:var(--host-primary-border)]",
};

/** Presentation-only status chip — does not redefine domain status rules. */
export function HostPortalStatusBadge({
  children,
  tone = "neutral",
  className,
  pulse,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        TONE[tone],
        className,
      )}
    >
      {pulse ? (
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
