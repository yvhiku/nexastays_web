"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Share2, X } from "lucide-react";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { attachmentFullUrl } from "./ProgressiveImage";

type Props = {
  attachments: AttachmentDto[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
};

export function MediaGallery({ attachments, initialIndex = 0, open, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const current = attachments[index];
  const url = current ? attachmentFullUrl(current) : null;

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : attachments.length - 1));
  }, [attachments.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < attachments.length - 1 ? i + 1 : 0));
  }, [attachments.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  if (!open || !current || !url) return null;

  const download = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = current.originalFilename ?? "image";
    a.click();
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: current.originalFilename ?? "Photo", url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm tabular-nums">
          {index + 1} / {attachments.length}
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={() => void share()} aria-label="Share">
            <Share2 className="h-5 w-5" />
          </button>
          <button type="button" onClick={download} aria-label="Download">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
        {attachments.length > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="max-h-[75dvh] max-w-full object-contain touch-pinch-zoom"
        />
        {attachments.length > 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
