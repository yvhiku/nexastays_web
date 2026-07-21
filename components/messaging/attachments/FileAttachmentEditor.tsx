"use client";

import React from "react";
import { FileText, X } from "lucide-react";
import type { AttachmentEditorProps } from "@/lib/messaging/attachments/registry";

export function FileAttachmentEditor({ item, onRemove, labels }: AttachmentEditorProps) {
  const sizeMb = (item.file.size / (1024 * 1024)).toFixed(1);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-[#1a1a1a] px-6 text-white">
      <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10">
        <FileText className="h-16 w-16 text-white/80" />
      </div>
      <div className="max-w-sm text-center">
        <p className="truncate text-lg font-semibold">{item.file.name}</p>
        <p className="mt-1 text-sm text-white/60">{sizeMb} MB</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full bg-white/10 px-4 py-2 text-sm"
      >
        {labels.remove}
      </button>
    </div>
  );
}
