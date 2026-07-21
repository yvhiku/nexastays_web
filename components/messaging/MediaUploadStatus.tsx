"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { MediaUploadMeta } from "@/lib/messaging/optimistic-media";

type Props = {
  meta: MediaUploadMeta;
  isOwn?: boolean;
  labels: {
    uploading: string;
    failed: string;
    retry: string;
  };
  onRetry?: () => void;
};

export function MediaUploadStatus({ meta, isOwn, labels, onRetry }: Props) {
  if (meta.uploadState === "complete") return null;

  if (meta.uploadState === "failed") {
    return (
      <div
        className={cn(
          "mt-1 flex items-center gap-2 rounded-lg px-2 py-1 text-xs",
          isOwn ? "justify-end text-red-200" : "text-red-600 bg-red-50",
        )}
      >
        <span>{meta.uploadError ?? labels.failed}</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline underline-offset-2"
          >
            {labels.retry}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("mt-1 space-y-1", isOwn ? "text-right" : "")}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-nexa-ink-4">
        <span>{meta.uploadLabel ?? labels.uploading}</span>
        <span className="tabular-nums">{meta.uploadProgress}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full bg-nexa-primary transition-all duration-200"
          style={{ width: `${Math.max(4, meta.uploadProgress)}%` }}
        />
      </div>
    </div>
  );
}
