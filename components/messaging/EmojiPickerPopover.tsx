"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
};

export function EmojiPickerPopover({ open, onClose, onPick, className }: Props) {
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
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full right-0 z-50 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-nexa-line bg-white p-3 shadow-lg",
        className,
      )}
      role="listbox"
      aria-label="Emoji picker"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="option"
            onClick={() => {
              onPick(emoji);
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-nexa-bg-2 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
