"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ImageOff,
  LoaderCircle,
  Share2,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { attachmentFullUrl, attachmentThumbUrl } from "./ProgressiveImage";
import { useFocusTrap } from "./hooks/useFocusTrap";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { useAttachmentDownload } from "./hooks/useAttachmentDownload";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";
import {
  endMessagingMeasure,
  startMessagingMeasure,
} from "@/lib/messaging/performance";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  attachments: AttachmentDto[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_CLICK_SCALE = 2.5;
const SWIPE_THRESHOLD = 56;

export function ImageViewer({
  attachments,
  initialIndex = 0,
  open,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [fullReady, setFullReady] = useState(false);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { state: downloadState, download } = useAttachmentDownload();

  useFocusTrap(open, dialogRef);

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    startMessagingMeasure("gallery-open");
    const memoryKey = `nexa-messaging-gallery:${attachments
      .slice(0, 12)
      .map((attachment) => attachment.id)
      .join(":")}`;
    let remembered = initialIndex;
    if (initialIndex === 0) {
      try {
        const stored = Number(localStorage.getItem(memoryKey));
        if (Number.isInteger(stored) && stored >= 0) remembered = stored;
      } catch {
        /* storage may be unavailable */
      }
    }
    setIndex(Math.min(remembered, Math.max(attachments.length - 1, 0)));
    resetTransform();
  }, [attachments, initialIndex, open, resetTransform]);

  useEffect(() => {
    if (!open || !attachments.length) return;
    try {
      const memoryKey = `nexa-messaging-gallery:${attachments
        .slice(0, 12)
        .map((attachment) => attachment.id)
        .join(":")}`;
      localStorage.setItem(memoryKey, String(index));
    } catch {
      /* storage may be unavailable */
    }
  }, [attachments, index, open]);

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
    if (!full || full === thumb) {
      endMessagingMeasure("gallery-open", {
        attachmentCount: attachments.length,
      });
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setDisplayUrl(full);
      setFullReady(true);
      endMessagingMeasure("gallery-open", {
        attachmentCount: attachments.length,
      });
    };
    image.onerror = () => {
      if (!cancelled) setFullReady(false);
    };
    image.src = full;
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [attachments.length, current, fullUrl, index, open, thumbUrl]);

  useEffect(() => {
    if (!open || attachments.length < 2) return;
    const adjacent = [
      attachments[(index + 1) % attachments.length],
      attachments[(index - 1 + attachments.length) % attachments.length],
    ];
    const preloaders = adjacent.flatMap((attachment) => {
      const url = attachment ? attachmentFullUrl(attachment) : null;
      if (!url) return [];
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      return [image];
    });
    return () => {
      for (const image of preloaders) image.src = "";
    };
  }, [attachments, index, open]);

  const goPrev = useCallback(() => {
    if (attachments.length <= 1) return;
    setIndex((value) =>
      value > 0 ? value - 1 : attachments.length - 1,
    );
    resetTransform();
  }, [attachments.length, resetTransform]);

  const goNext = useCallback(() => {
    if (attachments.length <= 1) return;
    setIndex((value) =>
      value < attachments.length - 1 ? value + 1 : 0,
    );
    resetTransform();
  }, [attachments.length, resetTransform]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Home" && attachments.length) {
        setIndex(0);
        resetTransform();
      }
      if (event.key === "End" && attachments.length) {
        setIndex(attachments.length - 1);
        resetTransform();
      }
      if (event.key === "0") resetTransform();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attachments.length, goNext, goPrev, onClose, open, resetTransform]);

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    setScale((value) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value + delta));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (scale <= 1) return;
    dragging.current = true;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging.current || scale <= 1) return;
    const dx = event.clientX - lastPoint.current.x;
    const dy = event.clientY - lastPoint.current.y;
    lastPoint.current = { x: event.clientX, y: event.clientY };
    setOffset((value) => ({ x: value.x + dx, y: value.y + dy }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 1 && scale === 1) {
      swipeStart.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
    if (event.touches.length === 2) {
      swipeStart.current = null;
      const [first, second] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY,
      );
      pinchStart.current = { distance, scale };
    }
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchStart.current) {
      const [first, second] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY,
      );
      const ratio = distance / pinchStart.current.distance;
      setScale(
        Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, pinchStart.current.scale * ratio),
        ),
      );
    }
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (swipeStart.current && event.changedTouches[0] && scale === 1) {
      const dx = event.changedTouches[0].clientX - swipeStart.current.x;
      const dy = event.changedTouches[0].clientY - swipeStart.current.y;
      if (
        Math.abs(dx) >= SWIPE_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy) * 1.2
      ) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }
    swipeStart.current = null;
    pinchStart.current = null;
  };

  const toggleZoom = () => {
    if (scale > 1) resetTransform();
    else setScale(DOUBLE_CLICK_SCALE);
  };

  const downloadUrl = fullUrl ?? displayUrl;
  const busy =
    downloadState === "preparing" || downloadState === "downloading";
  const DownloadStateIcon =
    busy
      ? LoaderCircle
      : downloadState === "completed"
        ? CheckCircle2
        : downloadState === "failed"
          ? AlertCircle
          : Download;

  const share = async () => {
    if (!downloadUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: current?.originalFilename ?? t("inbox.phase13.photo"),
          url: downloadUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(downloadUrl);
      }
    } catch {
      /* sharing was dismissed or unavailable */
    }
  };

  return (
    <OverlayPortal layer="modal">
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={dialogRef}
            className="fixed inset-0 z-layer-modal flex min-w-0 flex-col overflow-hidden bg-black/[0.92] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={
              current
                ? t("inbox.phase13.imagePosition")
                    .replace("{current}", String(index + 1))
                    .replace("{total}", String(attachments.length))
                : t("inbox.phase13.noSharedPhotos")
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : MESSAGING_MOTION.dialog,
              ease: MESSAGING_EASE_OUT,
            }}
          >
            <div className="relative z-layer-content flex min-h-16 items-center justify-between gap-3 px-3 py-2 text-white sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-messaging-4 backdrop-blur-xl transition-[background-color,transform] duration-messaging-hover hover:bg-white/[0.18] active:scale-95 active:duration-messaging-press motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 lg:h-10 lg:w-10"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              {current ? (
                <span
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold tabular-nums text-white shadow-lg backdrop-blur-xl"
                  aria-live="polite"
                >
                  {index + 1} / {attachments.length}
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1">
                {current && downloadUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void share()}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-150 hover:bg-white/[0.12] active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65"
                      aria-label={t("inbox.phase13.share")}
                    >
                      <Share2 className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void download(
                          downloadUrl,
                          current.originalFilename ?? "nexa-photo",
                          current.mime,
                          () =>
                            window.open(
                              downloadUrl,
                              "_blank",
                              "noopener,noreferrer",
                            ),
                        )
                      }
                      disabled={busy}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-150 hover:bg-white/[0.12] active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 disabled:opacity-60"
                      aria-label={t("inbox.phase11.download")}
                    >
                      <DownloadStateIcon
                        className={cn(
                          "h-5 w-5",
                          busy && "animate-spin motion-reduce:animate-none",
                        )}
                        aria-hidden
                      />
                    </button>
                  </>
                ) : (
                  <span className="h-11 w-11" aria-hidden />
                )}
              </div>
            </div>

            <div
              className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-3 pb-24 sm:px-14 sm:pb-28"
              onWheel={onWheel}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {!current ? (
                <div className="flex flex-col items-center px-6 text-center text-white">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.08] shadow-2xl">
                    <ImageOff className="h-8 w-8 text-white/70" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">
                    {t("inbox.phase13.noSharedPhotos")}
                  </h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/60">
                    {t("inbox.phase13.noSharedPhotosBody")}
                  </p>
                </div>
              ) : !thumbUrl && !fullUrl ? (
                <div
                  className="flex flex-col items-center px-6 text-center text-white"
                  role="status"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08]">
                    <ImageOff className="h-7 w-7 text-white/70" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-semibold">
                    {t("inbox.phase13.imageFailed")}
                  </p>
                </div>
              ) : displayUrl ? (
                <motion.img
                  key={current.id}
                  src={displayUrl}
                  alt={current.originalFilename ?? t("inbox.phase13.attachment")}
                  crossOrigin="anonymous"
                  draggable={false}
                  onDoubleClick={toggleZoom}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.985 }
                  }
                  animate={{ opacity: fullReady ? 1 : 0.88, scale: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : MESSAGING_MOTION.panel,
                    ease: MESSAGING_EASE_OUT,
                  }}
                  style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                    transition: dragging.current
                      ? "none"
                      : "transform 150ms ease-out",
                  }}
                  className={cn(
                    "max-h-[78dvh] max-w-full select-none object-contain will-change-transform",
                    scale > 1
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-zoom-in",
                  )}
                />
              ) : (
                <div
                  className="aspect-[4/3] w-[min(80vw,720px)] animate-pulse rounded-[24px] border border-white/10 bg-[linear-gradient(110deg,rgba(255,255,255,0.05),rgba(255,255,255,0.12),rgba(255,255,255,0.05))] motion-reduce:animate-none"
                  aria-label={t("inbox.phase13.loadingImage")}
                  role="status"
                />
              )}

              {current && attachments.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute start-3 hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-xl transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 md:flex"
                    aria-label={t("inbox.phase13.previousImage")}
                  >
                    <ChevronLeft
                      className="h-6 w-6 rtl:rotate-180"
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute end-3 hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-xl transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 md:flex"
                    aria-label={t("inbox.phase13.nextImage")}
                  >
                    <ChevronRight
                      className="h-6 w-6 rtl:rotate-180"
                      aria-hidden
                    />
                  </button>
                </>
              ) : null}
            </div>
            {current ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-layer-content bg-gradient-to-t from-black/80 via-black/45 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-14 text-white sm:px-8">
                <div className="mx-auto max-w-4xl">
                  <p className="truncate text-sm font-bold sm:text-base">
                    {current.originalFilename ?? t("inbox.phase13.photo")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/65">
                    {current.mime ? <span>{current.mime}</span> : null}
                    {current.sizeBytes ? (
                      <span>
                        {current.sizeBytes < 1024 * 1024
                          ? `${Math.round(current.sizeBytes / 1024)} KB`
                          : `${(current.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                    ) : null}
                    {current.width && current.height ? (
                      <span>
                        {current.width} × {current.height}
                      </span>
                    ) : null}
                  </div>
                  {busy ? (
                    <div
                      className="mt-3 h-1 max-w-xs overflow-hidden rounded-full bg-white/15"
                      role="progressbar"
                      aria-label={t("inbox.phase11.downloading")}
                    >
                      <span className="block h-full w-1/3 animate-[media-download_1s_ease-in-out_infinite] rounded-full bg-nexa-primary motion-reduce:animate-none" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}

/** @deprecated use ImageViewer */
export const MediaGallery = ImageViewer;
