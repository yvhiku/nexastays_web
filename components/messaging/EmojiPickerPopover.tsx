"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnchoredOverlayPortal } from "@/components/ui/OverlayPortal";

const EMOJIS = [
  "😀", "😂", "😊", "😍", "🥰", "😘", "😎", "🤗",
  "👍", "👏", "🙏", "💪", "✨", "🔥", "❤️", "💯",
  "😅", "🤔", "😢", "😭", "😡", "🙄", "😴", "🤩",
  "👋", "🎉", "✅", "⭐", "📍", "🏠", "🛏️", "🧳",
  "☀️", "🌊", "🍽️", "☕", "🚗", "✈️", "📷", "💬",
];

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  className?: string;
  anchor: React.RefObject<HTMLElement>;
};

export function EmojiPickerPopover({ open, onClose, onPick, className, anchor }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnchoredOverlayPortal
      anchor={anchor}
      layer="popover"
      side="top"
      align="end"
      minWidth={260}
      maxWidth={288}
      className={cn("rounded-2xl border border-nexa-line bg-white p-3 shadow-lg", className)}
    >
      <div ref={ref} role="listbox" aria-label="Emoji picker">
        <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              onClick={() => {
                onPick(emoji);
                onClose();
              }}
              className="flex h-11 w-full items-center justify-center rounded-lg text-xl hover:bg-nexa-bg-2 active:scale-95 sm:h-9"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </AnchoredOverlayPortal>
  );
}
