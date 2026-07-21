"use client";

import React from "react";
import { RotateCw, X } from "lucide-react";
import type { AttachmentEditorProps } from "@/lib/messaging/attachments/registry";

export function ImageAttachmentEditor({
  item,
  onRemove,
  onRotate,
  labels,
}: AttachmentEditorProps) {
  return (
    <div className="relative flex h-full flex-col bg-black">
      <div className="relative flex flex-1 min-h-0 items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
          style={{
            transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
            transition: "transform 0.2s ease-out",
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-white/10 p-2 text-white"
          aria-label={labels.remove}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRotate}
          className="rounded-full bg-white/10 p-2 text-white"
          aria-label={labels.rotate}
        >
          <RotateCw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
