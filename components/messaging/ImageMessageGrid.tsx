"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { ProgressiveImage, attachmentThumbUrl } from "./ProgressiveImage";

type Props = {
  attachments: AttachmentDto[];
  caption?: string;
  isOwn?: boolean;
  onOpen?: (index: number) => void;
};

export function ImageMessageGrid({ attachments, caption, isOwn, onOpen }: Props) {
  const count = attachments.length;
  const display = attachments.slice(0, 4);
  const extra = count > 4 ? count - 3 : 0;

  if (count === 1) {
    return (
      <div className={cn("max-w-[260px]", isOwn ? "ms-auto" : "")}>
        <ProgressiveImage
          src={attachmentThumbUrl(attachments[0])}
          className="h-48 w-full rounded-2xl cursor-pointer"
          onClick={() => onOpen?.(0)}
        />
        {caption ? <p className="mt-1 text-sm text-nexa-ink-3 px-1">{caption}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("grid max-w-[280px] gap-1", count === 2 ? "grid-cols-2" : "grid-cols-2")}>
      {display.map((att, i) => {
        const isOverlayCell = extra > 0 && i === 3;
        return (
          <button
            key={att.id}
            type="button"
            onClick={() => onOpen?.(i)}
            className={cn(
              "relative overflow-hidden rounded-xl",
              count === 3 && i === 0 ? "row-span-2 h-full min-h-[160px]" : "h-24",
            )}
          >
            <ProgressiveImage
              src={attachmentThumbUrl(att)}
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
    </div>
  );
}
