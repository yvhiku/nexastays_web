"use client";

import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, FileText, ImageIcon, Link2, Mic } from "lucide-react";
import type { AttachmentDto, MessageDto } from "@/lib/messaging/messages-api";
import { ProgressiveImage, attachmentThumbUrl } from "../ProgressiveImage";
import { MediaGalleryPage, type MediaGalleryLabels } from "./MediaGalleryPage";
import { buildMediaItems } from "./types";

type Props = {
  messages: MessageDto[];
  labels: MediaGalleryLabels & { shared: string; viewAll: string };
  counterpartName?: string;
  locale?: string;
  onOpenGallery: (attachments: AttachmentDto[], index: number) => void;
};

export function AttachmentRail({
  messages,
  labels,
  counterpartName,
  locale,
  onOpenGallery,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = useMemo(
    () => buildMediaItems(messages, counterpartName),
    [counterpartName, messages],
  );
  const recent = items.slice(0, 12);
  if (!items.length) return null;

  const icons = {
    photo: ImageIcon,
    file: FileText,
    voice: Mic,
    link: Link2,
  };

  return (
    <>
      <section
        className="mb-4 overflow-hidden rounded-[22px] border border-nexa-line/70 bg-white/85 p-4 shadow-messaging-1 backdrop-blur-sm"
        aria-label={labels.shared}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-nexa-ink">
              {labels.shared}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-nexa-ink-4">
              {items.length}
            </p>
          </div>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-nexa-primary transition-[background-color,transform] duration-150 hover:bg-nexa-primary-soft active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
          >
            {labels.viewAll}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
        </div>
        <div className="flex max-w-full snap-x gap-2 overflow-y-hidden pb-1 [overflow-x:auto] [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recent.map((item) => {
            if (item.category === "photo" && item.attachment) {
              const photos = recent.filter(
                (candidate) =>
                  candidate.category === "photo" && candidate.attachment,
              );
              const photoIndex = photos.findIndex(
                (candidate) => candidate.id === item.id,
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onOpenGallery(
                      photos.flatMap((photo) =>
                        photo.attachment ? [photo.attachment] : [],
                      ),
                      Math.max(photoIndex, 0),
                    )
                  }
                  className="h-20 w-20 shrink-0 snap-start overflow-hidden rounded-2xl border border-nexa-line/70 shadow-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-messaging-2 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/50"
                  aria-label={item.label}
                >
                  <ProgressiveImage
                    src={attachmentThumbUrl(item.attachment)}
                    blurhash={item.attachment.blurhash}
                    alt={item.label}
                    className="h-full w-full"
                  />
                </button>
              );
            }
            const Icon = icons[item.category];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-20 w-36 shrink-0 snap-start items-center gap-2 rounded-2xl border border-nexa-line/70 bg-[linear-gradient(145deg,#fff,#fbf5f8)] px-3 text-start shadow-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-messaging-2 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-nexa-primary-soft text-nexa-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 truncate text-xs font-bold text-nexa-ink-2">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <MediaGalleryPage
        open={open}
        messages={messages}
        labels={labels}
        counterpartName={counterpartName}
        locale={locale}
        onOpenGallery={onOpenGallery}
        onClose={() => {
          setOpen(false);
          requestAnimationFrame(() => triggerRef.current?.focus());
        }}
      />
    </>
  );
}
