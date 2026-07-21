"use client";

import React from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { executeCardAction } from "@/lib/messaging/actions/registry";
import { attachmentFullUrl } from "./ProgressiveImage";

type Props = {
  attachment: AttachmentDto;
  isOwn?: boolean;
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileMessageRow({ attachment, isOwn }: Props) {
  const url = attachmentFullUrl(attachment);
  const name = attachment.originalFilename ?? "Document";

  return (
    <div
      className={cn(
        "flex max-w-[280px] items-center gap-3 rounded-2xl border px-3 py-2",
        isOwn ? "border-white/20 bg-[#c13552] text-white" : "border-nexa-line bg-white text-nexa-ink",
      )}
    >
      <FileText className="h-8 w-8 shrink-0 opacity-80" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs opacity-70">{formatSize(attachment.sizeBytes)}</p>
      </div>
      {url ? (
        <button
          type="button"
          onClick={() =>
            executeCardAction(
              { id: "download", label: "Download", type: "DOWNLOAD", url },
              { localePath: (p) => p },
            )
          }
          className="text-xs font-semibold underline shrink-0"
        >
          Download
        </button>
      ) : null}
    </div>
  );
}
