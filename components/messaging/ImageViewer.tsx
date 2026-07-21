"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { attachmentFullUrl, attachmentThumbUrl } from "./ProgressiveImage";
import { useFocusTrap } from "./hooks/useFocusTrap";
import { downloadAttachmentFile } from "@/lib/messaging/download-attachment";

type Props = {
  attachments: AttachmentDto[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function ImageViewer({ attachments, initialIndex = 0, open, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [fullReady, setFullReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  const current = attachments[index];
  const thumbUrl = current ? attachmentThumbUrl(current) : null;
  const fullUrl = current ? attachmentFullUrl(current) : null;

  useEffect(() => {
    if (!open || !current) {
      setDisplayUrl(null);
      setFullReady(false);
      return;
    }

    const thumb = thumbUrl;
    const full = fullUrl;
    if (!thumb && !full) {
      setDisplayUrl(null);
      setFullReady(false);
      return;
    }

    setDisplayUrl(thumb ?? full);
    setFullReady(!full || full === thumb);

    if (!full || full === thumb) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setDisplayUrl(full);
      setFullReady(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      setFullReady(false);
    };
    img.src = full;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [open, index, current, thumbUrl, fullUrl]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : attachments.length - 1));
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [attachments.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < attachments.length - 1 ? i + 1 : 0));
    setScale(1);
    setOffset({ x: 0, y: 0 });
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

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || scale <= 1) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStart.current = { distance, scale };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = distance / pinchStart.current.distance;
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStart.current.scale * ratio)));
    }
  };

  const onTouchEnd = () => {
    pinchStart.current = null;
  };

  if (!open || !current || !displayUrl) return null;

  const downloadUrl = fullUrl ?? displayUrl;

  const download = async () => {
    if (!downloadUrl || downloading) return;
    setDownloading(true);
    try {
      await downloadAttachmentFile(
        downloadUrl,
        current.originalFilename ?? "nexa-photo",
        current.mime,
      );
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: current.originalFilename ?? "Photo", url: downloadUrl });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(downloadUrl);
    }
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${attachments.length}`}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm tabular-nums" aria-live="polite">
          {index + 1} / {attachments.length}
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={() => void share()} aria-label="Share">
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void download()}
            disabled={downloading}
            aria-label="Download"
          >
            <Download className={cn("h-5 w-5", downloading && "opacity-50")} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-8 touch-none"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {attachments.length > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt={current.originalFilename ?? "Attachment"}
          crossOrigin="anonymous"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging.current ? "none" : "transform 0.15s ease-out",
            filter: fullReady ? "none" : "blur(0px)",
          }}
          className={cn(
            "max-h-[75dvh] max-w-full object-contain select-none cursor-grab active:cursor-grabbing transition-opacity duration-200",
            fullReady ? "opacity-100" : "opacity-90",
          )}
        />
        {attachments.length > 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated use ImageViewer */
export const MediaGallery = ImageViewer;
