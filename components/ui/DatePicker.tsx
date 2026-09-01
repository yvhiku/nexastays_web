"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LAYERS } from "@/lib/ui/layers";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Optional controlled open state for guided date-selection flows. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  /** YYYY-MM-DD nights that cannot be selected (occupied). */
  disabledDates?: string[];
  clearLabel?: string;
  todayLabel?: string;
  className?: string;
  locale?: string;
  /** Max calendar panel width (px). Defaults to 280. */
  panelMaxWidth?: number;
  /** Trigger chrome — plain sits inside a parent field; field is a standalone bordered control. */
  variant?: "plain" | "field";
  "aria-label"?: string;
  id?: string;
  disabled?: boolean;
};

type PanelPos = { top: number; left: number; width: number };
type PanelMode = "days" | "months" | "years";

const YEAR_PAGE_SIZE = 12;
const DEFAULT_MIN_YEAR = 1900;

const TRIGGER = {
  plain:
    "w-full flex items-center gap-2 border-none outline-none bg-transparent font-sans text-sm text-start text-nexa-ink",
  field: cn(
    "w-full flex items-center gap-2 h-11 min-h-[44px] rounded-xl border-2 border-nexa-line bg-white px-3.5",
    "font-sans text-sm text-start text-nexa-ink",
    "focus-visible:border-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/20",
    "hover:border-nexa-primary/40 transition-colors",
  ),
} as const;

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
  open: controlledOpen,
  onOpenChange,
  placeholder = "mm/dd/yyyy",
  min,
  max,
  disabledDates,
  clearLabel = "Clear",
  todayLabel = "Today",
  className,
  locale = "en",
  panelMaxWidth = 280,
  variant = "plain",
  "aria-label": ariaLabel,
  id,
  disabled = false,
}: DatePickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );
  const [pos, setPos] = useState<PanelPos | null>(null);
  const selected = useMemo(() => (value ? parseISODate(value) : null), [value]);
  const [view, setView] = useState(() => selected ?? new Date());
  const [panelMode, setPanelMode] = useState<PanelMode>("days");
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
  const minYear = minDate?.getFullYear() ?? DEFAULT_MIN_YEAR;
  const maxYear = maxDate?.getFullYear() ?? today.getFullYear() + 20;

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelWidth = Math.min(panelMaxWidth, window.innerWidth - 16);
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
  }, [panelMaxWidth]);

  useEffect(() => {
    if (open) {
      setView(selected ?? (minDate && isAfter(minDate, today) ? minDate : today));
      setPanelMode("days");
      updatePosition();
    } else {
      setPos(null);
      setPanelMode("days");
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
  }, [open, setOpen, updatePosition]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(view),
    [locale, view],
  );

  const yearPageStart = useMemo(() => {
    const y = view.getFullYear();
    return y - ((y - minYear) % YEAR_PAGE_SIZE);
  }, [view, minYear]);

  const years = useMemo(
    () =>
      Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => {
        const year = yearPageStart + i;
        return {
          year,
          disabled: year < minYear || year > maxYear,
        };
      }),
    [yearPageStart, minYear, maxYear],
  );

  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    const year = view.getFullYear();
    return Array.from({ length: 12 }, (_, month) => {
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);
      const disabled =
        (minDate ? isAfter(minDate, lastOfMonth) : false) ||
        (maxDate ? isBefore(maxDate, firstOfMonth) : false);
      return {
        month,
        label: formatter.format(firstOfMonth),
        disabled,
      };
    });
  }, [locale, view, minDate, maxDate]);

  const headerLabel =
    panelMode === "years"
      ? `${years[0]?.year ?? yearPageStart} – ${years[years.length - 1]?.year ?? yearPageStart}`
      : panelMode === "months"
        ? String(view.getFullYear())
        : monthLabel;

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
    setView((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      if (next.getFullYear() < minYear || next.getFullYear() > maxYear) return prev;
      return next;
    });
  };

  const shiftYearPage = (deltaPages: number) => {
    setView((prev) => {
      const nextYear = prev.getFullYear() + deltaPages * YEAR_PAGE_SIZE;
      const clamped = Math.min(maxYear, Math.max(minYear, nextYear));
      return new Date(clamped, prev.getMonth(), 1);
    });
  };

  const shiftYear = (delta: number) => {
    setView((prev) => {
      const nextYear = prev.getFullYear() + delta;
      if (nextYear < minYear || nextYear > maxYear) return prev;
      return new Date(nextYear, prev.getMonth(), 1);
    });
  };

  const selectYear = (year: number) => {
    setView((prev) => new Date(year, prev.getMonth(), 1));
    setPanelMode("months");
  };

  const selectMonth = (month: number) => {
    setView((prev) => new Date(prev.getFullYear(), month, 1));
    setPanelMode("days");
  };

  const onHeaderClick = () => {
    if (panelMode === "days" || panelMode === "months") setPanelMode("years");
    else setPanelMode("days");
  };

  const onNavUp = () => {
    if (panelMode === "days") shiftMonth(1);
    else if (panelMode === "months") shiftYear(1);
    else shiftYearPage(1);
  };

  const onNavDown = () => {
    if (panelMode === "days") shiftMonth(-1);
    else if (panelMode === "months") shiftYear(-1);
    else shiftYearPage(-1);
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
          zIndex: LAYERS.datePicker,
        }}
        className="rounded-2xl border border-nexa-line bg-white p-3 shadow-nexa-lg"
      >
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <button
            type="button"
            onClick={onHeaderClick}
            className="text-sm font-semibold text-nexa-ink capitalize hover:text-nexa-primary transition-colors rounded-md px-1 -mx-1"
            aria-label={
              panelMode === "years"
                ? "Back to calendar"
                : `Select year, currently ${monthLabel}`
            }
          >
            {headerLabel}
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onNavUp}
              className="p-0.5 text-nexa-ink-3 hover:text-nexa-primary transition-colors"
              aria-label={
                panelMode === "years"
                  ? "Next years"
                  : panelMode === "months"
                    ? "Next year"
                    : "Next month"
              }
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavDown}
              className="p-0.5 text-nexa-ink-3 hover:text-nexa-primary transition-colors"
              aria-label={
                panelMode === "years"
                  ? "Previous years"
                  : panelMode === "months"
                    ? "Previous year"
                    : "Previous month"
              }
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {panelMode === "years" ? (
          <div className="grid grid-cols-3 gap-1.5 min-h-[228px] content-start">
            {years.map(({ year, disabled: yearDisabled }) => {
              const isSelected = selected?.getFullYear() === year;
              const isCurrent = view.getFullYear() === year;
              return (
                <button
                  key={year}
                  type="button"
                  disabled={yearDisabled}
                  onClick={() => selectYear(year)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium transition-colors",
                    !isSelected && "text-nexa-ink hover:bg-nexa-primary-soft hover:text-nexa-primary",
                    isCurrent && !isSelected && "ring-1 ring-inset ring-nexa-primary/35",
                    isSelected &&
                      "bg-nexa-primary text-white shadow-[0_2px_8px_rgba(232,80,122,0.35)] hover:bg-nexa-primary-dark hover:text-white",
                    yearDisabled && "opacity-35 cursor-not-allowed hover:bg-transparent hover:text-inherit",
                  )}
                >
                  {year}
                </button>
              );
            })}
          </div>
        ) : panelMode === "months" ? (
          <div className="grid grid-cols-3 gap-1.5 min-h-[228px] content-start">
            {months.map(({ month, label, disabled: monthDisabled }) => {
              const isSelected =
                selected?.getFullYear() === view.getFullYear() &&
                selected?.getMonth() === month;
              const isCurrent = view.getMonth() === month;
              return (
                <button
                  key={month}
                  type="button"
                  disabled={monthDisabled}
                  onClick={() => selectMonth(month)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium capitalize transition-colors",
                    !isSelected && "text-nexa-ink hover:bg-nexa-primary-soft hover:text-nexa-primary",
                    isCurrent && !isSelected && "ring-1 ring-inset ring-nexa-primary/35",
                    isSelected &&
                      "bg-nexa-primary text-white shadow-[0_2px_8px_rgba(232,80,122,0.35)] hover:bg-nexa-primary-dark hover:text-white",
                    monthDisabled && "opacity-35 cursor-not-allowed hover:bg-transparent hover:text-inherit",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <>
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
          </>
        )}

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
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          TRIGGER[variant],
          "min-w-0",
          open && variant === "field" && "border-nexa-primary ring-2 ring-nexa-primary/20",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "flex-1 min-w-0 truncate text-left",
            !displayValue && "text-nexa-ink-4",
          )}
        >
          {displayValue || placeholder}
        </span>
        <CalendarIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-nexa-ink-4",
            open && "text-nexa-primary",
          )}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}
