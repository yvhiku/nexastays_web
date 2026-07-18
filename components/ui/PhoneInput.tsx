"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PhoneCountry = {
  iso: string;
  dial: string;
  label: string;
  placeholder: string;
};

/** Compact list: MA default + common tourist origins */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "MA", dial: "212", label: "Morocco", placeholder: "6 XX XX XX XX" },
  { iso: "FR", dial: "33", label: "France", placeholder: "6 XX XX XX XX" },
  { iso: "ES", dial: "34", label: "Spain", placeholder: "6XX XXX XXX" },
  { iso: "DE", dial: "49", label: "Germany", placeholder: "15X XXXXXXX" },
  { iso: "GB", dial: "44", label: "United Kingdom", placeholder: "7XXX XXXXXX" },
  { iso: "US", dial: "1", label: "United States", placeholder: "201 555 0123" },
  { iso: "CA", dial: "1", label: "Canada", placeholder: "416 555 0123" },
  { iso: "BE", dial: "32", label: "Belgium", placeholder: "4XX XX XX XX" },
  { iso: "NL", dial: "31", label: "Netherlands", placeholder: "6 XXXXXXXX" },
  { iso: "IT", dial: "39", label: "Italy", placeholder: "3XX XXX XXXX" },
  { iso: "PT", dial: "351", label: "Portugal", placeholder: "9XX XXX XXX" },
  { iso: "AE", dial: "971", label: "UAE", placeholder: "5X XXX XXXX" },
  { iso: "SA", dial: "966", label: "Saudi Arabia", placeholder: "5X XXX XXXX" },
  { iso: "CH", dial: "41", label: "Switzerland", placeholder: "7X XXX XX XX" },
  { iso: "TR", dial: "90", label: "Turkey", placeholder: "5XX XXX XXXX" },
];

const OTHER_ISO = "OTHER";

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

  // Sync from parent when value has a full number (e.g. after OTP send normalize)
  useEffect(() => {
    if (!value) return;
    const matched = matchCountryFromE164(value);
    setIso(matched.iso);
    setDial(matched.dial);
    setNational(matched.national);
  }, [value]);

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

  return (
    <div
      className={cn(
        "flex rounded-lg border border-nexa-line bg-white overflow-hidden focus-within:ring-2 focus-within:ring-nexa-primary focus-within:ring-offset-0 focus-within:border-nexa-primary",
        className
      )}
    >
      <select
        aria-label="Country"
        value={iso}
        onChange={(e) => {
          const next = e.target.value;
          setIso(next);
          if (next === OTHER_ISO) {
            emit(dial.replace(/\D/g, "") || "1", "");
          } else {
            const c = PHONE_COUNTRIES.find((x) => x.iso === next) ?? PHONE_COUNTRIES[0];
            emit(c.dial, "");
          }
        }}
        className="max-w-[7.5rem] shrink-0 border-0 border-r border-nexa-line bg-nexa-bg-1 px-2 text-sm font-medium text-nexa-ink-4 focus:outline-none focus:ring-0"
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso}>
            {c.iso} +{c.dial}
          </option>
        ))}
        <option value={OTHER_ISO}>Other…</option>
      </select>

      {iso === OTHER_ISO ? (
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
          className="w-14 shrink-0 border-0 rounded-none border-r border-nexa-line focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />
      ) : (
        <span className="flex items-center px-3 text-nexa-ink-4 bg-nexa-bg-1 border-r border-nexa-line text-sm font-medium shrink-0">
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
        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
        {...rest}
      />
    </div>
  );
}
