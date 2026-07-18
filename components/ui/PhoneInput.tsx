"use client";

/**
 * Single source of truth for phone entry on Nexa Web.
 * New forms must use this component — do not build custom phone pickers.
 */

import React from "react";
import PhoneInputLib from "react-phone-number-input";
import type { Value } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import "./phone-input.css";

type PhoneInputProps = {
  /** Full E.164 (`+212…` / `+336…`) or empty */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
};

export function PhoneInput({
  value,
  onChange,
  className,
  placeholder = "Phone number",
  autoFocus,
  disabled,
  id,
  name,
  "aria-label": ariaLabel,
}: PhoneInputProps) {
  return (
    <PhoneInputLib
      international
      defaultCountry="MA"
      countryCallingCodeEditable={false}
      flags={flags}
      value={(value || undefined) as Value | undefined}
      onChange={(next) => onChange((next as string | undefined) ?? "")}
      placeholder={placeholder}
      className={cn("PhoneInput--nexa", className)}
      autoFocus={autoFocus}
      disabled={disabled}
      id={id}
      name={name}
      aria-label={ariaLabel}
    />
  );
}
