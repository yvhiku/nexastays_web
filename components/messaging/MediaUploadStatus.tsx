"use client";

import React from "react";
import { AlertTriangle, LoaderCircle, RotateCcw } from "lucide-react";
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

export function MediaUploadStatus({
  meta,
  isOwn,
  labels,
  onRetry,
}: Props) {
  if (meta.uploadState === "complete") return null;

  if (meta.uploadState === "failed") {
    return (
      <div
        role="alert"
        className={cn(
          "mt-2 flex min-w-0 items-center gap-3 rounded-messaging-dropdown border px-3 py-3 text-xs shadow-messaging-1",
          isOwn
            ? "border-white/20 bg-white/[0.12] text-white"
            : "border-red-200/75 bg-red-50 text-red-700",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            isOwn ? "bg-white/15" : "bg-red-100",
          )}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 break-words font-semibold">
          {meta.uploadError ?? labels.failed}
        </span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-3 font-bold transition-[background-color,transform] duration-messaging-hover active:scale-95 active:duration-messaging-press motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 lg:min-h-10",
              isOwn
                ? "bg-white text-nexa-primary hover:bg-white/90 focus-visible:ring-white/60"
                : "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400",
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {labels.retry}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-2 rounded-messaging-dropdown border px-3 py-3 shadow-messaging-1",
        isOwn
          ? "border-white/15 bg-white/10 text-white"
          : "border-nexa-primary/10 bg-white/80 text-nexa-ink",
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <LoaderCircle
            className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
          {meta.uploadLabel ?? labels.uploading}
        </span>
        <span className="shrink-0 tabular-nums">{meta.uploadProgress}%</span>
      </div>
      <div
        className={cn(
          "mt-2 h-1.5 overflow-hidden rounded-full",
          isOwn ? "bg-white/20" : "bg-nexa-primary/10",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200",
            isOwn
              ? "bg-white"
              : "bg-[linear-gradient(90deg,#f4809a,#e8507a,#c93a62)]",
          )}
          style={{ width: `${Math.max(4, meta.uploadProgress)}%` }}
        />
      </div>
    </div>
  );
}
