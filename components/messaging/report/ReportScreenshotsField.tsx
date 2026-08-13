"use client";

import React, { useEffect, useId, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportScreenshotDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

export const REPORT_SCREENSHOT_MAX = 3;

type Props = {
  items: ReportScreenshotDraft[];
  onChange: (items: ReportScreenshotDraft[]) => void;
  label: string;
  addLabel: string;
  removeLabel: string;
  hint?: string;
  disabled?: boolean;
};

function isAllowedImage(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  return (
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/gif"
  );
}

export function ReportScreenshotsField({
  items,
  onChange,
  label,
  addLabel,
  removeLabel,
  hint,
  disabled,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const item of items) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
    // Only revoke on unmount of the field; drafts are managed by parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length || disabled) return;
    const remaining = REPORT_SCREENSHOT_MAX - items.length;
    if (remaining <= 0) return;
    const next: ReportScreenshotDraft[] = [...items];
    for (const file of Array.from(fileList)) {
      if (next.length >= REPORT_SCREENSHOT_MAX) break;
      if (!isAllowedImage(file)) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-nexa-ink">{label}</span>
        <span className="text-xs text-nexa-ink-4">
          {items.length}/{REPORT_SCREENSHOT_MAX}
        </span>
      </div>

      {items.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-nexa-line bg-nexa-bg-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(item.id)}
                disabled={disabled}
                className="absolute end-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-50"
                aria-label={removeLabel}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {items.length < REPORT_SCREENSHOT_MAX ? (
        <>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(e) => addFiles(e.target.files)}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-nexa-line bg-white px-3 text-sm font-semibold text-nexa-ink-2 transition-[background-color,border-color] hover:border-nexa-primary/30 hover:bg-nexa-bg-2/70",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <ImagePlus className="h-4 w-4 text-nexa-primary" aria-hidden />
            {addLabel}
          </label>
        </>
      ) : null}

      {hint ? (
        <p className="text-xs leading-relaxed text-nexa-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}
