"use client";

import React from "react";
import {
  ReportScreenshotsField,
  type ReportScreenshotDraft,
} from "./ReportScreenshotsField";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  disabled?: boolean;
  screenshots: ReportScreenshotDraft[];
  onScreenshotsChange: (items: ReportScreenshotDraft[]) => void;
  screenshotsLabel: string;
  addScreenshotLabel: string;
  removeScreenshotLabel: string;
  screenshotsHint?: string;
};

export function ReportDetailsStep({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  maxLength = 500,
  disabled,
  screenshots,
  onScreenshotsChange,
  screenshotsLabel,
  addScreenshotLabel,
  removeScreenshotLabel,
  screenshotsHint,
}: Props) {
  return (
    <div className="space-y-4">
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

      <ReportScreenshotsField
        items={screenshots}
        onChange={onScreenshotsChange}
        label={screenshotsLabel}
        addLabel={addScreenshotLabel}
        removeLabel={removeScreenshotLabel}
        hint={screenshotsHint}
        disabled={disabled}
      />

      {helperText ? (
        <p className="text-xs leading-relaxed text-nexa-ink-3">{helperText}</p>
      ) : null}
    </div>
  );
}
