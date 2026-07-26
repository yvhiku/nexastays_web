"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnchoredOverlayPortal } from "@/components/ui/OverlayPortal";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const focusFrame = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLButtonElement>("button")?.focus(),
    );
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !anchor.current?.contains(target)
      ) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const buttons = Array.from(
        ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
      );
      if (!buttons.length) return;
      event.preventDefault();
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const columns = window.matchMedia("(min-width: 640px)").matches ? 8 : 5;
      const movement =
        event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowRight"
            ? 1
            : event.key === "ArrowUp"
              ? -columns
              : event.key === "ArrowDown"
                ? columns
                : 0;
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : Math.min(
                buttons.length - 1,
                Math.max(0, current < 0 ? 0 : current + movement),
              );
      buttons[next]?.focus();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, open, onClose]);

  if (!open) return null;

  return (
    <AnchoredOverlayPortal
      anchor={anchor}
      // The mobile/tablet conversation is itself a drawer-layer surface.
      // A nested popover must sit above that surface or it opens invisibly
      // behind the full-screen thread.
      layer="modal"
      side="top"
      align="end"
      minWidth={260}
      maxWidth={288}
      className={cn("rounded-messaging-dropdown border border-nexa-line bg-white p-3 shadow-messaging-3", className)}
    >
      <div ref={ref} role="listbox" aria-label={t("inbox.phase13.emojiPicker")}>
        <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected="false"
              aria-label={emoji}
              onClick={() => {
                onPick(emoji);
                onClose();
              }}
              className="flex h-12 w-full items-center justify-center rounded-lg text-xl transition-[background-color,transform] duration-messaging-hover hover:bg-nexa-bg-2 active:scale-95 active:duration-messaging-press motion-reduce:transition-none sm:h-10"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </AnchoredOverlayPortal>
  );
}
