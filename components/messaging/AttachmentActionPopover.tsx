"use client";

import React, { useEffect, useRef } from "react";
import { FileText, Images, MapPin } from "lucide-react";
import { AnchoredOverlayPortal } from "@/components/ui/OverlayPortal";

type Props = {
  open: boolean;
  anchor: React.RefObject<HTMLElement>;
  labels: {
    menu: string;
    photos: string;
    documents: string;
    location: string;
  };
  onClose: () => void;
  onChoosePhotos: () => void;
  onChooseDocument: () => void;
  onShareLocation: () => void;
};

const itemClass =
  "group flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-messaging-dropdown border border-transparent px-2 py-3 text-center text-xs font-semibold text-nexa-ink-2 transition-[background-color,border-color,box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:border-nexa-line hover:bg-nexa-bg-2 hover:text-nexa-ink hover:shadow-messaging-1 active:translate-y-0 active:scale-[0.98] active:duration-messaging-press motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45";

export function AttachmentActionPopover({
  open,
  anchor,
  labels,
  onClose,
  onChoosePhotos,
  onChooseDocument,
  onShareLocation,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusFrame = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus(),
    );

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !anchor.current?.contains(target)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
      );
      if (!items.length) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const rtl = document.documentElement.dir === "rtl";
      const forward =
        event.key === "ArrowRight"
          ? !rtl
          : event.key === "ArrowLeft"
            ? rtl
            : event.key === "ArrowDown";
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : (Math.max(current, 0) + (forward ? 1 : -1) + items.length) %
              items.length;
      items[next]?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchor, onClose, open]);

  if (!open) return null;

  const choose = (action: () => void) => {
    // Keep native file pickers inside the original click activation.
    action();
    onClose();
  };

  return (
    <AnchoredOverlayPortal
      anchor={anchor}
      layer="modal"
      side="top"
      align="start"
      minWidth={280}
      maxWidth={304}
      className="overflow-hidden rounded-messaging-dropdown border border-nexa-line bg-white/95 p-2 shadow-messaging-3 backdrop-blur-2xl"
    >
      <div ref={panelRef} role="menu" aria-label={labels.menu}>
        <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-nexa-ink-4">
          {labels.menu}
        </p>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose(onChoosePhotos)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-messaging-dropdown bg-nexa-bg-2 text-nexa-ink-3 shadow-messaging-1 transition-transform duration-messaging-hover group-hover:scale-105 motion-reduce:transition-none">
              <Images className="h-5 w-5 stroke-[1.75]" aria-hidden />
            </span>
            <span className="break-words">{labels.photos}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose(onChooseDocument)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-messaging-dropdown bg-nexa-bg-2 text-nexa-ink-3 shadow-messaging-1 transition-transform duration-messaging-hover group-hover:scale-105 motion-reduce:transition-none">
              <FileText className="h-5 w-5 stroke-[1.75]" aria-hidden />
            </span>
            <span className="break-words">{labels.documents}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose(onShareLocation)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-messaging-dropdown bg-nexa-bg-2 text-nexa-ink-3 shadow-messaging-1 transition-transform duration-messaging-hover group-hover:scale-105 motion-reduce:transition-none">
              <MapPin className="h-5 w-5 stroke-[1.75]" aria-hidden />
            </span>
            <span className="break-words">{labels.location}</span>
          </button>
        </div>
      </div>
    </AnchoredOverlayPortal>
  );
}
