"use client";

import React from "react";
import { NexaSelect, type NexaSelectOption } from "@/components/ui/NexaSelect";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  options: NexaSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
};

/** Thin portal wrapper around NexaSelect — no domain sort semantics. */
export function HostPortalSortSelect({
  label,
  value,
  options,
  onChange,
  className,
  id,
  disabled,
}: Props) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-xs font-medium text-[color:var(--host-muted)]">
        {label}
      </span>
      <NexaSelect
        id={id}
        variant="field"
        value={value}
        onChange={onChange}
        options={options}
        aria-label={label}
        disabled={disabled}
      />
    </label>
  );
}
