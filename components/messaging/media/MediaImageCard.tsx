"use client";

import React from "react";
import { Check, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressiveImage, attachmentThumbUrl } from "../ProgressiveImage";
import type { MediaItem } from "./types";

type Props = {
  item: MediaItem;
  selected?: boolean;
  selectionMode?: boolean;
  openLabel: string;
  onOpen: () => void;
  onSelect: () => void;
};

export function MediaImageCard({
  item,
  selected,
  selectionMode,
  openLabel,
  onOpen,
  onSelect,
}: Props) {
  return (
    <article
      className={cn(
        "group relative aspect-square min-w-0 overflow-hidden rounded-2xl border bg-nexa-bg shadow-messaging-1 transition-[transform,box-shadow,border-color] duration-150 motion-reduce:transition-none lg:hover:-translate-y-0.5 lg:hover:shadow-messaging-3",
        selected
          ? "border-nexa-primary ring-2 ring-nexa-primary/35"
          : "border-nexa-line/70",
      )}
    >
      <ProgressiveImage
        src={item.attachment ? attachmentThumbUrl(item.attachment) : null}
        blurhash={item.attachment?.blurhash}
        alt={item.label}
        actionLabel={`${openLabel}: ${item.label}`}
        onClick={selectionMode ? onSelect : onOpen}
        className="h-full w-full"
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className={cn(
          "absolute end-2 top-2 z-layer-content flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/30 text-white shadow-lg backdrop-blur-md transition-[opacity,transform,background-color] duration-150 motion-reduce:transition-none focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
          selectionMode || selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          selected && "bg-nexa-primary",
        )}
        aria-label={item.label}
        aria-pressed={selected}
      >
        {selected ? (
          <Check className="h-5 w-5" aria-hidden />
        ) : (
          <Images className="h-4 w-4" aria-hidden />
        )}
      </button>
    </article>
  );
}
