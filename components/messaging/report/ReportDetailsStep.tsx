"use client";

import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  disabled?: boolean;
};

export function ReportDetailsStep({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  maxLength = 500,
  disabled,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-nexa-ink">{label}</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          disabled={disabled}
          rows={5}
          maxLength={maxLength}
          className="w-full resize-none rounded-xl border border-nexa-line bg-white px-3.5 py-3 text-sm text-nexa-ink shadow-messaging-1 placeholder:text-nexa-ink-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/35 disabled:opacity-60"
        />
      </label>
      {helperText ? (
        <p className="text-xs leading-relaxed text-nexa-ink-3">{helperText}</p>
      ) : null}
    </div>
  );
}
