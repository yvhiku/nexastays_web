"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useAttachmentManager } from "@/lib/messaging/AttachmentManager";
import {
  getAttachmentKind,
  getAttachmentKindDef,
  listAttachmentKinds,
} from "@/lib/messaging/attachments/registry";
import "./attachments/register-defaults";

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
    comingSoon: string;
    uploadProgress: string;
    retry: string;
    close: string;
  };
  onSent?: () => void;
};

export function AttachmentComposer({ manager, labels, onSent }: Props) {
  const { state, removeItem, updateItemCrop, rotateItem, setCaption, sendBatch, retryFailed, closeComposer } =
    manager;
  const [activeIndex, setActiveIndex] = useState(0);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const trapRef = useRef<HTMLDivElement>(null);

  const items = state.items;
  const active = items[activeIndex];
  const kindDef = active ? getAttachmentKindDef(getAttachmentKind(active.file)) : null;
  const Editor = kindDef?.Editor;

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
    onSent?.();
    captionRef.current?.blur();
  }, [sendBatch, onSent]);

  if (!state.isOpen || items.length === 0) return null;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[90] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Attachment composer"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button type="button" onClick={closeComposer} aria-label={labels.close}>
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium tabular-nums">
          {activeIndex + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={state.isSending}
          className="flex items-center gap-1 rounded-full bg-nexa-primary px-4 py-2 text-sm font-semibold disabled:opacity-50"
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
            onCropChange={(crop, rotation) => updateItemCrop(active.id, crop, rotation)}
            onRotate={() => rotateItem(active.id)}
            labels={{
              remove: labels.remove,
              rotate: labels.rotate,
              crop: labels.crop,
              comingSoon: labels.comingSoon,
            }}
          />
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
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
                <span className="absolute inset-0 flex items-center justify-center bg-red-600/70 text-[10px] font-bold text-white">
                  !
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {state.progress ? (
        <div className="px-4 py-2">
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
        <div className="px-4 py-2 text-center text-sm text-red-300">
          {state.error}
          {items.some((i) => i.status === "failed") ? (
            <button type="button" className="ml-2 underline" onClick={() => void retryFailed()}>
              {labels.retry}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <textarea
          ref={captionRef}
          value={state.caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 2000))}
          placeholder={labels.captionPlaceholder}
          rows={2}
          disabled={state.isSending}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-nexa-primary/40"
        />
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {listAttachmentKinds()
            .filter((k) => !k.enabled)
            .map((k) => (
              <span
                key={k.kind}
                className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/40"
              >
                {k.kind} — {labels.comingSoon}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
