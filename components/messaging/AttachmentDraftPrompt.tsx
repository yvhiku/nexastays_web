"use client";

import React from "react";

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
    <div className="shrink-0 border-t border-nexa-line/60 bg-[#fff8f6] px-4 py-3">
      <p className="text-sm font-medium text-nexa-ink">{labels.title}</p>
      <p className="mt-0.5 text-xs text-nexa-ink-3">
        {fileCount} {fileCount === 1 ? "file" : "files"}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-nexa-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {labels.continue}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-full border border-nexa-line px-4 py-2 text-sm text-nexa-ink-3"
        >
          {labels.discard}
        </button>
      </div>
    </div>
  );
}
