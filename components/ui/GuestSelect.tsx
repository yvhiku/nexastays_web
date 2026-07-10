"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuestOption = {
  value: string;
  label: string;
};

type GuestSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: GuestOption[];
  className?: string;
  "aria-label"?: string;
};

export function GuestSelect({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: GuestSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 border-none outline-none bg-transparent font-sans text-sm text-left text-nexa-ink"
      >
        <span className="flex-1 truncate">{selected?.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-nexa-ink-4 transition-transform",
            open && "rotate-180 text-nexa-primary",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 min-w-[9.5rem] max-h-64 overflow-y-auto rounded-2xl border border-nexa-line bg-white py-1.5 shadow-nexa-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-nexa-primary text-white"
                      : "text-nexa-ink hover:bg-nexa-primary-soft hover:text-nexa-primary",
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
