"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  /** YYYY-MM-DD nights that cannot be selected (occupied). */
  disabledDates?: string[];
  clearLabel?: string;
  todayLabel?: string;
  className?: string;
  locale?: string;
};

type PanelPos = { top: number; left: number; width: number };

function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

export function DatePicker({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  min,
  max,
  disabledDates,
  clearLabel = "Clear",
  todayLabel = "Today",
  className,
  locale = "en",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const selected = useMemo(() => (value ? parseISODate(value) : null), [value]);
  const [view, setView] = useState(() => selected ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const minDate = useMemo(() => (min ? parseISODate(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseISODate(max) : null), [max]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const disabledSet = useMemo(
    () => new Set(disabledDates ?? []),
    [disabledDates],
  );

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelWidth = Math.min(280, window.innerWidth - 16);
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8);
    }
    const gap = 12;
    let top = rect.bottom + gap;
    // Prefer below; if not enough space, flip above after measuring (approx 320px)
    const approxHeight = 340;
    if (top + approxHeight > window.innerHeight - 8 && rect.top > approxHeight) {
      top = rect.top - gap - approxHeight;
    }
    setPos({ top, left, width: panelWidth });
  }, []);

  useEffect(() => {
    if (open) {
      setView(selected ?? (minDate && isAfter(minDate, today) ? minDate : today));
      updatePosition();
    } else {
      setPos(null);
    }
  }, [open, selected, minDate, today, updatePosition]);

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

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(view),
    [locale, view],
  );

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2023, 0, 1 + i);
      return formatter.format(d).slice(0, 2);
    });
  }, [locale]);

  const days = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i,
      );
      const outside = date.getMonth() !== month;
      const iso = toISODate(date);
      const disabled =
        (minDate ? isBefore(date, minDate) : false) ||
        (maxDate ? isAfter(date, maxDate) : false) ||
        disabledSet.has(iso);
      return { date, outside, disabled };
    });
  }, [view, minDate, maxDate, disabledSet]);

  const displayValue = selected
    ? new Intl.DateTimeFormat(locale, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }).format(selected)
    : "";

  const shiftMonth = (delta: number) => {
    setView((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const selectDate = (date: Date) => {
    onChange(toISODate(date));
    setOpen(false);
  };

  const todayIso = toISODate(today);
  const todayDisabled =
    (minDate ? isBefore(today, minDate) : false) ||
    (maxDate ? isAfter(today, maxDate) : false) ||
    disabledSet.has(todayIso);

  const panel =
    open &&
    pos &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        id={listboxId}
        role="dialog"
        aria-label={monthLabel}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 1000,
        }}
        className="rounded-2xl border border-nexa-line bg-white p-3 shadow-nexa-lg"
      >
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <p className="text-sm font-semibold text-nexa-ink capitalize">{monthLabel}</p>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-0.5 text-nexa-ink-3 hover:text-nexa-primary transition-colors"
              aria-label="Next month"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-0.5 text-nexa-ink-3 hover:text-nexa-primary transition-colors"
              aria-label="Previous month"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekdayLabels.map((label, i) => (
            <div
              key={`${label}-${i}`}
              className="h-8 flex items-center justify-center text-[0.7rem] font-medium text-nexa-ink-3"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map(({ date, outside, disabled }) => {
            const isSelected = selected ? sameDay(date, selected) : false;
            const isToday = sameDay(date, today);

            return (
              <button
                key={toISODate(date)}
                type="button"
                disabled={disabled}
                onClick={() => selectDate(date)}
                className={cn(
                  "h-9 w-full rounded-lg text-sm font-medium transition-colors",
                  outside && !isSelected && "text-nexa-ink-4",
                  !outside && !isSelected && "text-nexa-ink",
                  !isSelected && !disabled && "hover:bg-nexa-primary-soft hover:text-nexa-primary",
                  isToday && !isSelected && "ring-1 ring-inset ring-nexa-primary/35",
                  isSelected &&
                    "bg-nexa-primary text-white shadow-[0_2px_8px_rgba(232,80,122,0.35)] hover:bg-nexa-primary-dark hover:text-white",
                  disabled && "opacity-35 cursor-not-allowed hover:bg-transparent hover:text-inherit",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-2.5 border-t border-nexa-line flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-sm font-medium text-nexa-primary hover:text-nexa-primary-dark transition-colors"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            disabled={todayDisabled}
            onClick={() => {
              if (todayDisabled) return;
              selectDate(today);
            }}
            className="text-sm font-medium text-nexa-primary hover:text-nexa-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {todayLabel}
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 border-none outline-none bg-transparent font-sans text-sm text-left text-nexa-ink"
      >
        <span className={cn("flex-1 truncate", !displayValue && "text-nexa-ink-4")}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-nexa-ink-4" aria-hidden />
      </button>
      {panel}
    </div>
  );
}
