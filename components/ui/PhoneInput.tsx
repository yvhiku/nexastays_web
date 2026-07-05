"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Morocco phone input: +212 prefix fixed, user types 612345677 or 0612345677 */
const MOROCCO_PREFIX = "+212";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PhoneInput({ value, onChange, className, placeholder = "6 XX XX XX XX", ...rest }: PhoneInputProps) {
  return (
    <div
      className={cn(
        "flex rounded-lg border border-nexa-line bg-white overflow-hidden focus-within:ring-2 focus-within:ring-nexa-primary focus-within:ring-offset-0 focus-within:border-nexa-primary",
        className
      )}
    >
      <span className="flex items-center px-4 text-nexa-ink-4 bg-nexa-bg-1 border-r border-nexa-line text-sm font-medium shrink-0">
        {MOROCCO_PREFIX}
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
        {...rest}
      />
    </div>
  );
}
