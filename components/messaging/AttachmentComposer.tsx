"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, RotateCcw, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useAttachmentManager } from "@/lib/messaging/AttachmentManager";
import {
  getAttachmentKind,
  getAttachmentKindDef,
} from "@/lib/messaging/attachments/registry";
import { useFocusTrap } from "./hooks/useFocusTrap";
import "./attachments/register-defaults";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";

type Manager = ReturnType<typeof useAttachmentManager>;

type Props = {
  manager: Manager;
  labels: {
    captionPlaceholder: string;
    send: string;
    discard: string;
    remove: string;
    rotate: string;
    crop: string;
    uploadProgress: string;
    retry: string;
    close: string;
  };
};

export function AttachmentComposer({ manager, labels }: Props) {
  const { state, removeItem, rotateItem, setCaption, sendBatch, retryFailed, closeComposer } =
    manager;
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const trapRef = useRef<HTMLDivElement>(null);

  const items = state.items;
  const active = items[activeIndex];
  const kindDef = active ? getAttachmentKindDef(getAttachmentKind(active.file)) : null;
  const Editor = kindDef?.Editor;

  useFocusTrap(state.isOpen && items.length > 0, trapRef);

  useEffect(() => {
    if (!state.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComposer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.isOpen, closeComposer]);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(items.length - 1);
    }
  }, [activeIndex, items.length]);

  const handleSend = useCallback(async () => {
    await sendBatch();
    captionRef.current?.blur();
  }, [sendBatch]);

  if (!state.isOpen || items.length === 0) return null;

  return (
    <OverlayPortal layer="modal">
    <motion.div
      ref={trapRef}
      className="fixed inset-0 z-layer-modal flex flex-col bg-black/[0.92] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Attachment composer"
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.995 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduceMotion ? 0 : MESSAGING_MOTION.dialog,
        ease: MESSAGING_EASE_OUT,
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-3 text-white sm:px-4">
        <button
          type="button"
          onClick={closeComposer}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
          aria-label={labels.close}
        >
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium tabular-nums">
          {activeIndex + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={state.isSending}
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-nexa-primary px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {labels.send}
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        {Editor && active ? (
          <Editor
            item={active}
            onRemove={() => {
              removeItem(active.id);
              if (items.length <= 1) closeComposer();
            }}
            onRotate={() => rotateItem(active.id)}
            labels={{
              remove: labels.remove,
              rotate: labels.rotate,
              crop: labels.crop,
            }}
          />
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="flex max-h-32 flex-wrap justify-center gap-2 overflow-x-hidden overflow-y-auto px-4 py-2">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                idx === activeIndex ? "border-nexa-primary" : "border-transparent opacity-70",
              )}
            >
              {item.kind === "image" && item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-white/10 text-[10px] text-white">
                  PDF
                </span>
              )}
              {item.status === "failed" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-red-700/70 text-white backdrop-blur-[1px]">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {state.progress ? (
        <div className="px-4 py-2" aria-live="polite" aria-atomic="true">
          <div className="mb-1 flex justify-between text-xs text-white/80">
            <span>{state.progress.label}</span>
            <span>{state.progress.overallPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-nexa-primary transition-all"
              style={{ width: `${state.progress.overallPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {state.error ? (
        <div className="px-4 py-2" role="alert">
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-red-100 shadow-lg backdrop-blur-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 break-words text-xs font-semibold">
              {state.error}
            </span>
            {items.some((item) => item.status === "failed") ? (
              <>
                <button
                  type="button"
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-red-600 transition-transform duration-150 active:scale-95 motion-reduce:transition-none"
                  onClick={() => void retryFailed()}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {labels.retry}
                </button>
                {active?.status === "failed" ? (
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-100 transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    onClick={() => {
                      removeItem(active.id);
                      if (items.length <= 1) closeComposer();
                    }}
                    aria-label={labels.remove}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <textarea
          ref={captionRef}
          value={state.caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 2000))}
          placeholder={labels.captionPlaceholder}
          aria-label={labels.captionPlaceholder}
          rows={2}
          disabled={state.isSending}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-nexa-primary/40"
        />
      </div>
    </motion.div>
    </OverlayPortal>
  );
}
