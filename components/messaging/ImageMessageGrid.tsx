"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import type { MediaUploadMeta } from "@/lib/messaging/optimistic-media";
import { ProgressiveImage, attachmentThumbUrl } from "./ProgressiveImage";
import { MediaUploadStatus } from "./MediaUploadStatus";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  attachments: AttachmentDto[];
  caption?: string;
  isOwn?: boolean;
  uploadMeta?: MediaUploadMeta | null;
  uploadLabels?: {
    uploading: string;
    failed: string;
    retry: string;
  };
  onOpen?: (index: number) => void;
  onRetryUpload?: () => void;
};

export function ImageMessageGrid({
  attachments,
  caption,
  isOwn,
  uploadMeta,
  uploadLabels,
  onOpen,
  onRetryUpload,
}: Props) {
  const { t } = useLanguage();
  const count = attachments.length;
  const display = attachments.slice(0, 4);
  const extra = count > 4 ? count - 3 : 0;

  if (count === 1) {
    return (
      <div className={cn("max-w-[260px]", isOwn ? "ms-auto" : "")}>
        <button
          type="button"
          onClick={() => onOpen?.(0)}
          className="block w-full rounded-2xl border border-white shadow-[0_8px_22px_rgba(83,41,60,0.14)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_11px_28px_rgba(83,41,60,0.18)] active:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/50"
          aria-label={t("inbox.openImage").replace("{number}", "1")}
        >
          <ProgressiveImage
            src={attachmentThumbUrl(attachments[0])}
            alt={attachments[0]?.originalFilename ?? ""}
            className="h-48 w-full rounded-2xl"
          />
        </button>
        {caption ? <p className="mt-1 text-sm text-nexa-ink-3 px-1">{caption}</p> : null}
        {uploadMeta && uploadLabels ? (
          <MediaUploadStatus
            meta={uploadMeta}
            isOwn={isOwn}
            labels={uploadLabels}
            onRetry={onRetryUpload}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("", isOwn ? "ms-auto" : "")}>
      <div className={cn("grid max-w-[280px] gap-1", count === 2 ? "grid-cols-2" : "grid-cols-2")}>
      {display.map((att, i) => {
        const isOverlayCell = extra > 0 && i === 3;
        return (
          <button
            key={att.id}
            type="button"
            onClick={() => onOpen?.(i)}
            aria-label={t("inbox.openImage").replace("{number}", String(i + 1))}
            className={cn(
              "relative overflow-hidden rounded-xl border border-white shadow-[0_6px_18px_rgba(83,41,60,0.12)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_9px_24px_rgba(83,41,60,0.17)] active:translate-y-0 motion-reduce:transition-none",
              count === 3 && i === 0 ? "row-span-2 h-full min-h-[160px]" : "h-24",
            )}
          >
            <ProgressiveImage
              src={attachmentThumbUrl(att)}
              alt={att.originalFilename ?? ""}
              className="h-full w-full"
            />
            {isOverlayCell ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                +{extra}
              </span>
            ) : null}
          </button>
        );
      })}
      {caption ? (
        <p className={cn("col-span-2 text-sm text-nexa-ink-3 px-1", isOwn ? "text-right" : "")}>{caption}</p>
      ) : null}
      {uploadMeta && uploadLabels ? (
        <div className="col-span-2">
          <MediaUploadStatus
            meta={uploadMeta}
            isOwn={isOwn}
            labels={uploadLabels}
            onRetry={onRetryUpload}
          />
        </div>
      ) : null}
    </div>
    </div>
  );
}
