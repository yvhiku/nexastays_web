"use client";

import React, { useEffect, useRef, useState } from "react";
import { Archive, Ban, BellOff, BellRing, Flag, MoreVertical, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPermissions } from "@/lib/messaging/messages-api";

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2.5 text-sm text-nexa-ink hover:bg-nexa-bg-2 text-start";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-nexa-ink-3 hover:bg-nexa-bg-2"
        aria-label={labels.menu}
        aria-expanded={open}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute end-0 top-full mt-1 w-52 py-1 bg-white rounded-xl shadow-lg border border-nexa-line z-50">
          <button
            type="button"
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
        </div>
      ) : null}
    </div>
  );
}
