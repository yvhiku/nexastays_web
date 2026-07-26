"use client";

import React from "react";
import { FileText, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  fileCount: number;
  labels: {
    title: string;
    continue: string;
    discard: string;
  };
  onContinue: () => void;
  onDiscard: () => void;
};

export function AttachmentDraftPrompt({ open, fileCount, labels, onContinue, onDiscard }: Props) {
  if (!open || fileCount <= 0) return null;

  return (
    <div className="mx-3 mb-2 flex shrink-0 flex-wrap items-center gap-3 rounded-messaging-card border border-nexa-line bg-white px-4 py-3 shadow-messaging-1 sm:mx-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-messaging-dropdown bg-nexa-bg-2 text-nexa-ink-3">
        <FileText className="h-5 w-5 stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-nexa-ink">{labels.title}</p>
        <p className="mt-0.5 text-xs text-nexa-ink-3">
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="min-h-12 rounded-full bg-nexa-primary px-4 text-xs font-bold text-white shadow-messaging-1 transition-[box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:shadow-messaging-2 active:translate-y-0 active:duration-messaging-press motion-reduce:transition-none lg:min-h-10"
        >
          {labels.continue}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="flex min-h-12 items-center gap-2 rounded-full border border-nexa-line bg-white px-3 text-xs font-semibold text-nexa-ink-3 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-red-600 active:scale-[0.98] active:duration-messaging-press lg:min-h-10"
        >
          <Trash2 className="h-4 w-4 stroke-[1.75]" aria-hidden />
          {labels.discard}
        </button>
      </div>
    </div>
  );
}
