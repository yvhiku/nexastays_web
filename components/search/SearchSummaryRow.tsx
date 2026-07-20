"use client";

import React from "react";
import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  hasValue: boolean;
  completed?: boolean;
  flash?: boolean;
  onClick: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  className?: string;
};

export function SearchSummaryRow({
  icon: Icon,
  label,
  value,
  hasValue,
  completed,
  flash,
  onClick,
  buttonRef,
  className,
}: Props) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full min-h-[64px] items-center gap-3 border-b border-nexa-line/70 px-1 py-3 text-start",
        "transition-[background-color,transform] duration-200 active:scale-[0.98]",
        flash && "bg-nexa-primary-soft/70",
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-nexa-bg-2 text-nexa-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate text-[0.95rem] font-semibold transition-transform duration-200",
            hasValue ? "text-nexa-ink translate-y-0" : "text-nexa-ink-4",
            flash && hasValue && "animate-in fade-in slide-in-from-bottom-1",
          )}
        >
          {value}
        </span>
      </span>
      {completed ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nexa-primary/15 text-nexa-primary">
          <Check className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-nexa-ink-4 rtl:rotate-180" aria-hidden />
      )}
    </button>
  );
}
