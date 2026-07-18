"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PhoneCountry = {
  iso: string;
  flag: string;
  name: string;
  dial: string;
  placeholder: string;
};

/** Compact list: MA default + common tourist origins */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "MA", flag: "🇲🇦", name: "Morocco", dial: "212", placeholder: "6 XX XX XX XX" },
  { iso: "FR", flag: "🇫🇷", name: "France", dial: "33", placeholder: "6 XX XX XX XX" },
  { iso: "ES", flag: "🇪🇸", name: "Spain", dial: "34", placeholder: "6XX XXX XXX" },
  { iso: "DE", flag: "🇩🇪", name: "Germany", dial: "49", placeholder: "15X XXXXXXX" },
  { iso: "GB", flag: "🇬🇧", name: "United Kingdom", dial: "44", placeholder: "7XXX XXXXXX" },
  { iso: "US", flag: "🇺🇸", name: "United States", dial: "1", placeholder: "201 555 0123" },
  { iso: "CA", flag: "🇨🇦", name: "Canada", dial: "1", placeholder: "416 555 0123" },
  { iso: "BE", flag: "🇧🇪", name: "Belgium", dial: "32", placeholder: "4XX XX XX XX" },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands", dial: "31", placeholder: "6 XXXXXXXX" },
  { iso: "IT", flag: "🇮🇹", name: "Italy", dial: "39", placeholder: "3XX XXX XXXX" },
  { iso: "PT", flag: "🇵🇹", name: "Portugal", dial: "351", placeholder: "9XX XXX XXX" },
  { iso: "AE", flag: "🇦🇪", name: "UAE", dial: "971", placeholder: "5X XXX XXXX" },
  { iso: "SA", flag: "🇸🇦", name: "Saudi Arabia", dial: "966", placeholder: "5X XXX XXXX" },
  { iso: "CH", flag: "🇨🇭", name: "Switzerland", dial: "41", placeholder: "7X XXX XX XX" },
  { iso: "TR", flag: "🇹🇷", name: "Turkey", dial: "90", placeholder: "5XX XXX XXXX" },
];

const OTHER_ISO = "OTHER";

type PickerOption =
  | { kind: "country"; country: PhoneCountry }
  | { kind: "other" };

function maxNationalDigits(dial: string): number {
  return Math.max(4, 15 - Math.max(dial.length, 1));
}

/** Longest dial-code match against known countries */
export function matchCountryFromE164(value: string): {
  iso: string;
  dial: string;
  national: string;
} {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return { iso: "MA", dial: "212", national: "" };
  }

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      return {
        iso: c.iso,
        dial: c.dial,
        national: digits.slice(c.dial.length).slice(0, maxNationalDigits(c.dial)),
      };
    }
  }

  const dialLen = Math.min(3, Math.max(1, digits.length - 4));
  return {
    iso: OTHER_ISO,
    dial: digits.slice(0, dialLen),
    national: digits.slice(dialLen),
  };
}

function toE164(dial: string, national: string): string {
  const d = dial.replace(/\D/g, "");
  const n = national.replace(/\D/g, "");
  if (!d || !n) return "";
  return `+${d}${n}`;
}

function filterOptions(query: string): PickerOption[] {
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  const countries: PickerOption[] = PHONE_COUNTRIES.filter((c) => {
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.dial.includes(q)
    );
  }).map((country) => ({ kind: "country" as const, country }));

  const otherMatches =
    !q ||
    "other".includes(q) ||
    q === "oth";
  const options = [...countries];
  if (otherMatches) options.push({ kind: "other" });
  return options;
}

function optionKey(opt: PickerOption): string {
  return opt.kind === "other" ? OTHER_ISO : opt.country.iso;
}

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Full E.164 (`+336…` / `+212…`) or empty */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  className,
  placeholder,
  ...rest
}: PhoneInputProps) {
  const [iso, setIso] = useState("MA");
  const [dial, setDial] = useState("212");
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filtered = useMemo(() => filterOptions(search), [search]);

  // Sync from parent when value has a full number (e.g. after OTP send normalize)
  useEffect(() => {
    if (!value) return;
    const matched = matchCountryFromE164(value);
    setIso(matched.iso);
    setDial(matched.dial);
    setNational(matched.national);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlight(0);
      // Focus search after paint
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setHighlight((h) => (filtered.length === 0 ? 0 : Math.min(h, filtered.length - 1)));
  }, [filtered.length]);

  const country =
    iso === OTHER_ISO
      ? null
      : PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0];

  const displayPlaceholder =
    placeholder ?? country?.placeholder ?? "Phone number";

  const emit = (nextDial: string, nextNational: string) => {
    setDial(nextDial);
    setNational(nextNational);
    onChange(toE164(nextDial, nextNational));
  };

  const selectOption = (opt: PickerOption) => {
    if (opt.kind === "other") {
      setIso(OTHER_ISO);
      emit(dial.replace(/\D/g, "") || "1", "");
    } else {
      setIso(opt.country.iso);
      emit(opt.country.dial, "");
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  const closePicker = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onPickerKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) =>
        filtered.length ? (h - 1 + filtered.length) % filtered.length : 0
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const opt = filtered[highlight];
      if (opt) selectOption(opt);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)} onKeyDown={onPickerKeyDown}>
      <div
        className={cn(
          "flex overflow-hidden rounded-lg border border-nexa-line bg-white focus-within:ring-2 focus-within:ring-nexa-primary focus-within:ring-offset-0 focus-within:border-nexa-primary"
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-label="Country"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 max-w-[8.5rem] sm:max-w-[11rem] shrink-0 items-center gap-1.5 border-0 border-r border-nexa-line bg-nexa-bg-1 px-2.5 sm:px-3 py-2.5 text-sm font-medium text-nexa-ink hover:bg-nexa-bg-2 transition-colors focus:outline-none"
        >
          {iso === OTHER_ISO ? (
            <span className="truncate">Other</span>
          ) : (
            <>
              <span className="shrink-0 text-base leading-none" aria-hidden>
                {country?.flag}
              </span>
              <span className="min-w-0 truncate" title={country?.name}>
                {country?.name}
              </span>
            </>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-nexa-ink-4 transition-transform ms-auto",
              open && "rotate-180 text-nexa-primary"
            )}
            aria-hidden
          />
        </button>

        {iso === OTHER_ISO ? (
          <div className="flex items-center shrink-0 border-r border-nexa-line bg-white pl-3 pr-1">
            <span className="text-sm font-medium text-nexa-ink-4">+</span>
            <Input
              type="tel"
              inputMode="numeric"
              aria-label="Country code"
              value={dial}
              onChange={(e) => {
                const nextDial = e.target.value.replace(/\D/g, "").slice(0, 3);
                emit(nextDial, national);
              }}
              placeholder="33"
              className="w-12 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 h-auto py-2.5 min-h-0"
            />
          </div>
        ) : (
          <span className="flex items-center px-3 text-nexa-ink-4 text-sm font-medium shrink-0 border-r border-nexa-line tabular-nums">
            +{dial}
          </span>
        )}

        <Input
          type="tel"
          inputMode="numeric"
          placeholder={displayPlaceholder}
          value={national}
          onChange={(e) => {
            const nat = e.target.value
              .replace(/\D/g, "")
              .slice(0, maxNationalDigits(dial || "1"));
            emit(dial, nat);
          }}
          className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0 min-h-0 h-auto py-2.5"
          {...rest}
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-nexa-line bg-white shadow-nexa-lg"
          role="presentation"
        >
          <div className="border-b border-nexa-line p-2">
            <Input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country…"
              aria-label="Search country"
              className="h-9 min-h-0 rounded-xl border-nexa-line text-sm py-2"
              onKeyDown={onPickerKeyDown}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label="Country"
            className="max-h-64 overflow-y-auto py-1.5"
          >
            {filtered.length === 0 ? (
              <li className="px-3.5 py-3 text-sm text-nexa-ink-4">No countries found</li>
            ) : (
              filtered.map((opt, index) => {
                const key = optionKey(opt);
                const isSelected =
                  opt.kind === "other" ? iso === OTHER_ISO : iso === opt.country.iso;
                const isHighlighted = index === highlight;
                return (
                  <li key={key} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => selectOption(opt)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors",
                        isSelected && "bg-nexa-primary-soft text-nexa-primary font-medium",
                        !isSelected && isHighlighted && "bg-nexa-bg-2",
                        !isSelected && !isHighlighted && "text-nexa-ink hover:bg-nexa-bg-2"
                      )}
                    >
                      {opt.kind === "other" ? (
                        <>
                          <span className="w-5 text-center" aria-hidden>
                            …
                          </span>
                          <span className="flex-1 font-medium">Other</span>
                        </>
                      ) : (
                        <>
                          <span className="w-5 shrink-0 text-base leading-none" aria-hidden>
                            {opt.country.flag}
                          </span>
                          <span className="flex-1 truncate">{opt.country.name}</span>
                          <span className="shrink-0 tabular-nums text-nexa-ink-4">
                            +{opt.country.dial}
                          </span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
