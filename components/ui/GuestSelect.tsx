"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type PanelPos = { top: number; left: number; width: number };

export function GuestSelect({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: GuestSelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 152);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    const gap = 12;
    let top = rect.bottom + gap;
    const approxHeight = Math.min(256, options.length * 44 + 16);
    if (top + approxHeight > window.innerHeight - 8 && rect.top > approxHeight) {
      top = rect.top - gap - approxHeight;
    }
    setPos({ top, left, width });
  }, [options.length]);

  useEffect(() => {
    if (open) {
      updatePosition();
    } else {
      setPos(null);
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updatePosition]);

  const panel =
    open &&
    pos &&
    typeof document !== "undefined" &&
    createPortal(
      <ul
        ref={panelRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 1000,
        }}
        className="max-h-64 overflow-y-auto rounded-2xl border border-nexa-line bg-white py-1.5 shadow-nexa-lg"
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
      </ul>,
      document.body,
    );

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
      {panel}
    </div>
  );
}
