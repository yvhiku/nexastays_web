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

function ImageMessageGridInner({
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
  const moreLabel = t("listings.loadMore").trim().split(/\s+/).at(-1);
  const first = attachments[0];
  const firstAspect =
    first?.width && first?.height
      ? Math.max(0.82, Math.min(1.65, first.width / first.height))
      : 4 / 3;

  if (count === 1) {
    return (
      <div className={cn("min-w-0 w-full max-w-[360px]", isOwn ? "ms-auto" : "")}>
        <div
          className="block w-full overflow-hidden rounded-messaging-bubble border border-nexa-line bg-nexa-bg-2 shadow-messaging-2 transition-[box-shadow,transform] duration-messaging-hover lg:hover:scale-[1.02] lg:hover:shadow-messaging-3 motion-reduce:transition-none"
          style={{ aspectRatio: firstAspect }}
        >
          <ProgressiveImage
            src={attachmentThumbUrl(attachments[0])}
            alt={attachments[0]?.originalFilename ?? ""}
            className="h-full w-full"
            onClick={() => onOpen?.(0)}
            actionLabel={t("inbox.openImage").replace("{number}", "1")}
            errorLabel={t("inbox.imageLoadFailed")}
            retryLabel={t("inbox.attachmentComposer.retry")}
          />
        </div>
        {caption ? (
          <p
            className={cn(
              "mt-2 px-1 text-sm leading-5 text-nexa-ink-2",
              isOwn && "text-end",
            )}
          >
            {caption}
          </p>
        ) : null}
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
    <div className={cn("min-w-0 w-full max-w-[360px]", isOwn ? "ms-auto" : "")}>
      <div className="grid w-full grid-cols-2 gap-2 overflow-hidden rounded-messaging-bubble border border-nexa-line bg-white p-2 shadow-messaging-2">
      {display.map((att, i) => {
        const isOverlayCell = extra > 0 && i === 3;
        return (
          <div
            key={att.id}
            className={cn(
              "relative overflow-hidden rounded-xl border border-nexa-line/70 bg-nexa-bg-2 shadow-messaging-1 transition-[box-shadow,transform] duration-messaging-hover lg:hover:z-layer-content lg:hover:scale-[1.02] lg:hover:shadow-messaging-2 motion-reduce:transition-none",
              count === 2
                ? "h-44"
                : count === 3 && i === 0
                  ? "col-span-2 h-44"
                  : "h-32",
            )}
          >
            <ProgressiveImage
              src={attachmentThumbUrl(att)}
              alt={att.originalFilename ?? ""}
              className="h-full w-full"
              onClick={() => onOpen?.(i)}
              actionLabel={t("inbox.openImage").replace(
                "{number}",
                String(i + 1),
              )}
              errorLabel={t("inbox.imageLoadFailed")}
              retryLabel={t("inbox.attachmentComposer.retry")}
            />
            {isOverlayCell ? (
              <span className="pointer-events-none absolute inset-0 z-layer-content flex flex-col items-center justify-center bg-[linear-gradient(145deg,rgba(24,14,19,0.48),rgba(24,14,19,0.76))] text-white backdrop-blur-[1px]">
                <span className="text-lg font-bold leading-none">
                  +{extra} {moreLabel}
                </span>
                <span className="mt-1 h-0.5 w-7 rounded-full bg-nexa-primary" aria-hidden />
              </span>
            ) : null}
          </div>
        );
      })}
      {caption ? (
        <p className={cn("col-span-2 px-1 pt-1 text-sm leading-5 text-nexa-ink-2", isOwn ? "text-end" : "")}>{caption}</p>
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

export const ImageMessageGrid = React.memo(
  ImageMessageGridInner,
  (previous, next) =>
    previous.attachments === next.attachments &&
    previous.caption === next.caption &&
    previous.isOwn === next.isOwn &&
    previous.uploadMeta?.uploadState === next.uploadMeta?.uploadState &&
    previous.uploadMeta?.uploadProgress === next.uploadMeta?.uploadProgress &&
    previous.uploadMeta?.uploadLabel === next.uploadMeta?.uploadLabel &&
    previous.uploadMeta?.uploadError === next.uploadMeta?.uploadError &&
    previous.uploadLabels?.uploading === next.uploadLabels?.uploading &&
    previous.uploadLabels?.failed === next.uploadLabels?.failed &&
    previous.uploadLabels?.retry === next.uploadLabels?.retry,
);
