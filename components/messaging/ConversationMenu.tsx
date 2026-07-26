"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Archive, Ban, BellOff, BellRing, Flag, MoreVertical, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPermissions } from "@/lib/messaging/messages-api";
import { AnchoredOverlayPortal } from "@/components/ui/OverlayPortal";
import { PremiumTooltip } from "./PremiumTooltip";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";

const MUTE_KEY_PREFIX = "nexa_messaging_mute:";

export function isConversationMuted(conversationId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${MUTE_KEY_PREFIX}${conversationId}`) === "1";
  } catch {
    return false;
  }
}

export function setConversationMuted(conversationId: string, muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) {
      localStorage.setItem(`${MUTE_KEY_PREFIX}${conversationId}`, "1");
    } else {
      localStorage.removeItem(`${MUTE_KEY_PREFIX}${conversationId}`);
    }
  } catch {
    /* ignore */
  }
}

type Props = {
  permissions: ConversationPermissions;
  muted: boolean;
  labels: {
    menu: string;
    archive: string;
    delete: string;
    restore: string;
    report: string;
    block: string;
    safety: string;
    mute: string;
    unmute: string;
    reportPrompt: string;
  };
  onArchive: () => void;
  onDelete: () => void;
  onReport: (reason?: string) => void;
  onBlock: () => void;
  onSafety: () => void;
  onMuteChange: (muted: boolean) => void;
};

export function ConversationMenu({
  permissions,
  muted,
  labels,
  onArchive,
  onDelete,
  onReport,
  onBlock,
  onSafety,
  onMuteChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const itemClass =
    "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-nexa-ink transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 active:scale-[0.99] active:duration-messaging-press motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nexa-primary/35 lg:min-h-10";

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ) ?? [],
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") {
      items[0]?.focus();
      return;
    }
    if (event.key === "End") {
      items.at(-1)?.focus();
      return;
    }
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <PremiumTooltip label={labels.menu}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-nexa-ink-3 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none lg:h-10 lg:w-10"
          aria-label={labels.menu}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <MoreVertical className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
        </button>
      </PremiumTooltip>
      {open ? (
        <AnchoredOverlayPortal
          anchor={ref}
          layer="dropdown"
          align="end"
          minWidth={208}
          maxWidth={208}
          className="rounded-messaging-dropdown border border-nexa-line bg-white/95 p-2 shadow-messaging-3 backdrop-blur-2xl"
        >
        <motion.div
          ref={panelRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : MESSAGING_MOTION.button,
            ease: MESSAGING_EASE_OUT,
          }}
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              onMuteChange(!muted);
              setOpen(false);
            }}
          >
            {muted ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {muted ? labels.unmute : labels.mute}
          </button>
          {permissions.canReport ? (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                const reason = window.prompt(labels.reportPrompt) ?? undefined;
                onReport(reason);
                setOpen(false);
              }}
            >
              <Flag className="h-4 w-4" />
              {labels.report}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              onSafety();
              setOpen(false);
            }}
          >
            <ShieldAlert className="h-4 w-4 text-red-600" />
            {labels.safety}
          </button>
          {permissions.canBlock ? (
            <button
              type="button"
              role="menuitem"
              className={cn(itemClass, "text-red-600")}
              onClick={() => {
                if (window.confirm(labels.block)) onBlock();
                setOpen(false);
              }}
            >
              <Ban className="h-4 w-4" />
              {labels.block}
            </button>
          ) : null}
          {permissions.canArchive ? (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                onArchive();
                setOpen(false);
              }}
            >
              <Archive className="h-4 w-4" />
              {labels.archive}
            </button>
          ) : null}
          {permissions.canDelete ? (
            <button
              type="button"
              role="menuitem"
              className={cn(itemClass, "text-red-600")}
              onClick={() => {
                if (window.confirm(labels.delete)) onDelete();
                setOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
              {labels.delete}
            </button>
          ) : null}
        </motion.div>
        </AnchoredOverlayPortal>
      ) : null}
    </div>
  );
}
