"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

export type DateRangeFieldProps = {
  checkin: string;
  checkout: string;
  onChange: (next: { checkin: string; checkout: string }) => void;
  /** Called when both ends of the range are set */
  onComplete?: () => void;
  min?: string;
  locale?: string;
  clearLabel?: string;
  className?: string;
};

function MonthGrid({
  view,
  locale,
  checkin,
  checkout,
  minDate,
  today,
  hover,
  onDayClick,
  onDayHover,
}: {
  view: Date;
  locale: string;
  checkin: Date | null;
  checkout: Date | null;
  minDate: Date | null;
  today: Date;
  hover: Date | null;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
}) {
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(view);

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
      const disabled = minDate ? isBefore(date, minDate) : false;
      return { date, outside, disabled };
    });
  }, [view, minDate]);

  const rangeEnd =
    checkout ??
    (checkin && hover && isAfter(hover, checkin) ? hover : null);

  return (
    <div className="min-w-0 w-full">
      <p className="text-sm font-semibold text-nexa-ink capitalize mb-3 px-1">
        {monthLabel}
      </p>
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
          const iso = toISODate(date);
          const isStart = checkin ? sameDay(date, checkin) : false;
          const isEnd = checkout ? sameDay(date, checkout) : false;
          const inRange =
            checkin &&
            rangeEnd &&
            !isBefore(date, checkin) &&
            !isAfter(date, rangeEnd);
          const isToday = sameDay(date, today);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
              onClick={() => onDayClick(date)}
              className={cn(
                "h-9 w-full text-sm font-medium transition-colors relative",
                outside && !isStart && !isEnd && "text-nexa-ink-4",
                !outside && !isStart && !isEnd && "text-nexa-ink",
                inRange && !isStart && !isEnd && "bg-nexa-primary-soft/70 rounded-none",
                isStart && "bg-nexa-primary text-white rounded-l-full rounded-r-none",
                isEnd && "bg-nexa-primary text-white rounded-r-full rounded-l-none",
                isStart && isEnd && "rounded-full",
                !isStart &&
                  !isEnd &&
                  !disabled &&
                  "hover:bg-nexa-primary-soft hover:text-nexa-primary rounded-full",
                isToday && !isStart && !isEnd && "ring-1 ring-inset ring-nexa-primary/35 rounded-full",
                disabled && "opacity-35 cursor-not-allowed hover:bg-transparent",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Dual-month range calendar panel (presets slot reserved, empty). */
export function DateRangePanel({
  checkin,
  checkout,
  onChange,
  onComplete,
  min,
  locale = "en",
  clearLabel = "Clear",
  className,
}: DateRangeFieldProps) {
  const checkinDate = useMemo(() => (checkin ? parseISODate(checkin) : null), [checkin]);
  const checkoutDate = useMemo(
    () => (checkout ? parseISODate(checkout) : null),
    [checkout],
  );
  const minDate = useMemo(() => (min ? parseISODate(min) : startOfDay(new Date())), [min]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState(
    () => checkinDate ?? minDate ?? today,
  );
  const [hover, setHover] = useState<Date | null>(null);

  const secondMonth = useMemo(
    () => new Date(view.getFullYear(), view.getMonth() + 1, 1),
    [view],
  );

  const onDayClick = (date: Date) => {
    const iso = toISODate(date);
    if (!checkin || (checkin && checkout)) {
      onChange({ checkin: iso, checkout: "" });
      return;
    }
    if (checkinDate && isBefore(date, checkinDate)) {
      onChange({ checkin: iso, checkout: "" });
      return;
    }
    if (checkinDate && sameDay(date, checkinDate)) {
      return;
    }
    onChange({ checkin, checkout: iso });
    onComplete?.();
  };

  return (
    <div className={cn("p-4 sm:p-5", className)}>
      {/* Reserved presets slot — not implemented this ship */}
      <div className="hidden" aria-hidden data-search-date-presets />

      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() =>
            setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
          }
          className="p-2 rounded-full hover:bg-nexa-bg-2 text-nexa-ink-3 hover:text-nexa-primary"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
          }
          className="p-2 rounded-full hover:bg-nexa-bg-2 text-nexa-ink-3 hover:text-nexa-primary"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <MonthGrid
          view={view}
          locale={locale}
          checkin={checkinDate}
          checkout={checkoutDate}
          minDate={minDate}
          today={today}
          hover={hover}
          onDayClick={onDayClick}
          onDayHover={setHover}
        />
        <div className="hidden lg:block">
          <MonthGrid
            view={secondMonth}
            locale={locale}
            checkin={checkinDate}
            checkout={checkoutDate}
            minDate={minDate}
            today={today}
            hover={hover}
            onDayClick={onDayClick}
            onDayHover={setHover}
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-nexa-line flex justify-start">
        <button
          type="button"
          onClick={() => onChange({ checkin: "", checkout: "" })}
          className="text-sm font-medium text-nexa-primary hover:text-nexa-primary-dark"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
