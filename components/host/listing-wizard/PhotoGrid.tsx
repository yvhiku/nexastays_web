"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripVertical, RotateCcw, Star, X } from "lucide-react";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MediaCategory, WizardPhoto } from "@/lib/host-listing-wizard/form-types";
import { coverPhotoId } from "@/lib/host-listing-wizard/photo-queue";
import { MEDIA_CATEGORIES } from "@/lib/host-listing-wizard/step-content";
import { cn } from "@/lib/utils";
import { WizardStatusIcon } from "./wizard-status";

export interface PhotoGridActions {
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onSetCover: (id: string) => void;
  onSetCategory: (id: string, category: MediaCategory) => void;
}

const K = "hostListing.wizard.photos.";

/**
 * Photo workspace grid.
 * - Pointer: native HTML5 drag-and-drop between tiles (works on a 2-D grid,
 *   unlike single-axis reorder lists). Tiles animate into place with
 *   framer-motion `layout`, disabled under prefers-reduced-motion.
 * - Keyboard / single-pointer alternative (WCAG 2.2 dragging movements):
 *   Move previous / Move next buttons on every tile + live announcement.
 * - Cover = corner star chip. Border color is reserved for the error state.
 * - Upload progress = radial ring over the thumbnail (indeterminate; the
 *   upload endpoint does not stream byte progress).
 */
export function PhotoGrid({
  photos,
  actions,
}: {
  photos: WizardPhoto[];
  actions: PhotoGridActions;
}) {
  const { t, tf } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const coverId = coverPhotoId(photos);
  const categoryOptions = React.useMemo(
    () => MEDIA_CATEGORIES.map((c) => ({ value: c.id, label: t(c.labelKey) })),
    [t],
  );

  const announceMove = (id: string, nextIndex: number) => {
    const p = photos.find((x) => x.id === id);
    if (!p) return;
    setAnnouncement(
      tf(K + "movedTo", { position: nextIndex + 1, total: photos.length }),
    );
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = photos.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    actions.onReorder(ids);
    announceMove(dragId, to);
    setDragId(null);
    setOverId(null);
  };

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <ul
        role="list"
        aria-label={t(K + "gridLabel")}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {photos.map((p, idx) => {
          const isCover = p.id === coverId;
          const uploading = p.uploadStatus === "uploading" || p.uploadStatus === "pending";
          const failed = p.uploadStatus === "error";
          const positionLabel = tf(K + "photoPosition", { position: idx + 1, total: photos.length });
          return (
            <motion.li
              key={p.id}
              layout={!reduceMotion}
              transition={{ duration: 0.18, ease: "easeOut" }}
              aria-label={positionLabel}
              className="list-none"
            >
            {/* Native HTML5 DnD lives on a plain div so it never collides with framer-motion's own drag gesture props. */}
            <div
              draggable={!uploading}
              onDragStart={(e) => {
                setDragId(p.id);
                e.dataTransfer.setData("text/plain", p.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (overId !== p.id) setOverId(p.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === p.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(p.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border-2 bg-white shadow-nexa-sm transition-[border-color,opacity] duration-150",
                failed ? "border-red-500" : "border-nexa-line",
                overId === p.id && dragId && dragId !== p.id && "border-nexa-primary/60",
                dragId === p.id && "opacity-60",
              )}
            >
              <div className="relative aspect-[4/3] w-full bg-nexa-bg-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.preview}
                  alt={t(`hostListing.wizard.mediaCategories.${p.category}`)}
                  className={cn(
                    "h-full w-full object-cover transition-opacity duration-150",
                    uploading && "opacity-60",
                  )}
                  draggable={false}
                />

                {isCover && !failed && (
                  <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-md bg-nexa-ink/80 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                    {t(K + "cover")}
                  </span>
                )}

                {uploading && (
                  <span
                    role="status"
                    aria-label={t(K + "uploading")}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <UploadRing />
                  </span>
                )}

                {failed && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 p-2 text-center">
                    <WizardStatusIcon status="error" size={20} className="text-red-600" />
                    <span
                      className="line-clamp-2 text-xs font-medium text-red-700"
                      title={p.uploadError || undefined}
                    >
                      {t(K + "uploadFailed")}
                    </span>
                    <button
                      type="button"
                      onClick={() => actions.onRetry(p.id)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-nexa-primary px-3 text-xs font-semibold text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(K + "retry")}
                    </button>
                  </span>
                )}

                {!uploading && !failed && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 end-2 hidden rounded-md bg-nexa-ink/60 p-1 text-white group-hover:block"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => actions.onRemove(p.id)}
                  aria-label={tf(K + "removePhoto", { position: idx + 1 })}
                  className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-nexa-ink shadow-nexa-sm transition-colors duration-150 hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-2 p-2.5">
                <NexaSelect
                  variant="field"
                  value={p.category}
                  onChange={(v) => actions.onSetCategory(p.id, v as MediaCategory)}
                  aria-label={tf(K + "categoryFor", { position: idx + 1 })}
                  options={categoryOptions}
                />
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => actions.onSetCover(p.id)}
                    aria-pressed={isCover}
                    disabled={failed}
                    className={cn(
                      "inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors duration-150",
                      isCover
                        ? "text-nexa-primary"
                        : "text-nexa-ink-3 hover:bg-nexa-bg-2 hover:text-nexa-ink",
                    )}
                  >
                    <Star className={cn("h-3.5 w-3.5", isCover && "fill-current")} aria-hidden="true" />
                    {isCover ? t(K + "coverPhoto") : t(K + "setAsCover")}
                  </button>
                  <span className="flex items-center">
                    <MoveButton
                      label={tf(K + "movePrevious", { position: idx + 1 })}
                      disabled={idx === 0}
                      onClick={() => {
                        actions.onMove(p.id, -1);
                        announceMove(p.id, idx - 1);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </MoveButton>
                    <MoveButton
                      label={tf(K + "moveNext", { position: idx + 1 })}
                      disabled={idx === photos.length - 1}
                      onClick={() => {
                        actions.onMove(p.id, 1);
                        announceMove(p.id, idx + 1);
                      }}
                    >
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </MoveButton>
                  </span>
                </div>
              </div>
            </div>
            </motion.li>
          );
        })}
      </ul>
    </>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-nexa-ink-3 transition-colors duration-150 hover:bg-nexa-bg-2 hover:text-nexa-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/30"
    >
      {children}
    </button>
  );
}

/** Indeterminate radial ring over the thumbnail. */
function UploadRing() {
  return (
    <svg
      viewBox="0 0 44 44"
      className="h-11 w-11 motion-safe:animate-spin"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="#C42A58"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="70 43"
      />
    </svg>
  );
}
