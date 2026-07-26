"use client";

import React, { useMemo, useRef, useState } from "react";
import { CheckSquare, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { AttachmentDto, MessageDto } from "@/lib/messaging/messages-api";
import { cn } from "@/lib/utils";
import { MESSAGING_EASE_OUT, MESSAGING_MOTION } from "@/lib/messaging/motion";
import { GalleryEmptyState } from "./GalleryEmptyState";
import { MediaGrid } from "./MediaGrid";
import {
  buildMediaItems,
  type MediaCategory,
  type MediaItem,
} from "./types";

export type MediaGalleryLabels = {
  title: string;
  close: string;
  all: string;
  photos: string;
  files: string;
  voice: string;
  links: string;
  today: string;
  yesterday: string;
  open: string;
  download: string;
  downloading: string;
  downloaded: string;
  failed: string;
  select: string;
  selected: string;
  emptyTitle: string;
  emptyBody: string;
};

type Props = {
  open: boolean;
  messages: MessageDto[];
  labels: MediaGalleryLabels;
  counterpartName?: string;
  locale?: string;
  onClose: () => void;
  onOpenGallery: (attachments: AttachmentDto[], index: number) => void;
};

const categoryOrder: Exclude<MediaCategory, "all">[] = [
  "photo",
  "file",
  "voice",
  "link",
];

export function MediaGalleryPage({
  open,
  messages,
  labels,
  counterpartName,
  locale,
  onClose,
  onOpenGallery,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState<MediaCategory>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useFocusTrap(open, dialogRef);

  const items = useMemo(
    () => buildMediaItems(messages, counterpartName),
    [counterpartName, messages],
  );
  const available = useMemo(
    () =>
      categoryOrder.filter((id) => items.some((item) => item.category === id)),
    [items],
  );
  const filtered =
    category === "all"
      ? items
      : items.filter((item) => item.category === category);
  const photos = items.filter(
    (item): item is MediaItem & { attachment: AttachmentDto } =>
      item.category === "photo" && !!item.attachment,
  );
  const categoryLabels = {
    photo: labels.photos,
    file: labels.files,
    voice: labels.voice,
    link: labels.links,
  };
  const selectionMode = selectedIds.size > 0;

  const close = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <OverlayPortal layer="modal">
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="fixed inset-0 z-layer-modal flex min-w-0 flex-col overflow-hidden bg-[rgba(30,18,24,0.5)] p-0 backdrop-blur-md sm:p-4 lg:p-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : MESSAGING_MOTION.dialog,
              ease: MESSAGING_EASE_OUT,
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
            }}
          >
            <motion.div
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white shadow-messaging-4 sm:rounded-[28px] sm:border sm:border-white/70"
              initial={reduceMotion ? undefined : { scale: 0.985, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { scale: 0.99, y: 5 }}
              transition={{
                duration: reduceMotion ? 0 : MESSAGING_MOTION.panel,
                ease: MESSAGING_EASE_OUT,
              }}
            >
              <header className="shrink-0 border-b border-nexa-line/70 bg-white/90 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6 sm:pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-nexa-ink sm:text-2xl">
                      {labels.title}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold text-nexa-ink-4">
                      {selectionMode
                        ? labels.selected.replace(
                            "{count}",
                            String(selectedIds.size),
                          )
                        : `${items.length}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-nexa-line bg-white text-nexa-ink-2 shadow-sm transition-[background-color,transform] duration-150 hover:bg-nexa-bg active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45"
                    aria-label={labels.close}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label={labels.title}
                >
                  {(["all", ...available] as MediaCategory[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={category === id}
                      onClick={() => setCategory(id)}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40",
                        category === id
                          ? "bg-nexa-primary text-white shadow-[0_7px_18px_rgba(232,80,122,0.25)]"
                          : "border border-nexa-line bg-white text-nexa-ink-3 hover:bg-nexa-primary-soft hover:text-nexa-primary",
                      )}
                    >
                      {id === "all" ? labels.all : categoryLabels[id]}
                    </button>
                  ))}
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8">
                {filtered.length ? (
                  <MediaGrid
                    items={filtered}
                    selectedIds={selectedIds}
                    selectionMode={selectionMode}
                    locale={locale}
                    labels={labels}
                    onOpenImage={(item) => {
                      const index = photos.findIndex(
                        (photo) => photo.id === item.id,
                      );
                      onOpenGallery(
                        photos.map((photo) => photo.attachment),
                        Math.max(index, 0),
                      );
                    }}
                    onToggleSelection={(id) =>
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                  />
                ) : (
                  <GalleryEmptyState
                    category={category}
                    title={labels.emptyTitle}
                    body={labels.emptyBody}
                  />
                )}
              </div>
              {selectionMode ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex justify-center px-4">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-nexa-ink px-5 text-sm font-bold text-white shadow-messaging-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/60"
                  >
                    <CheckSquare className="h-4 w-4 text-nexa-primary" aria-hidden />
                    {labels.selected.replace(
                      "{count}",
                      String(selectedIds.size),
                    )}
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
