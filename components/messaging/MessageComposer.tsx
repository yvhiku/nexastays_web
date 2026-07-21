"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;
const COUNTDOWN_THRESHOLD = 200;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder: string;
  sendLabel: string;
  readOnlyHint?: string;
  onFocus?: () => void;
  onActivity?: () => void;
};

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  sendLabel,
  readOnlyHint,
  onFocus,
  onActivity,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = MAX_LENGTH - value.length;
  const showCountdown = remaining <= COUNTDOWN_THRESHOLD;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  if (readOnlyHint) {
    return (
      <div className="px-4 py-3 bg-nexa-bg-2 border-t border-nexa-line/60 text-center">
        <p className="text-sm text-nexa-ink-3">{readOnlyHint}</p>
      </div>
    );
  }

  return (
    <footer className="shrink-0 z-50 border-t border-[#F7F7F7] bg-[rgba(252,249,248,0.92)] backdrop-blur-2xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-3 max-w-2xl mx-auto w-full">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              const next = e.target.value.slice(0, MAX_LENGTH);
              onChange(next);
              onActivity?.();
            }}
            onFocus={() => {
              onFocus?.();
              onActivity?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className={cn(
              "w-full resize-none rounded-full border-none bg-[#F7F7F7] px-5 py-3 pe-12 text-base text-nexa-ink",
              "placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/20 min-h-[48px] max-h-[120px]",
              disabled && "opacity-60 cursor-not-allowed",
            )}
            aria-label={placeholder}
          />
          {showCountdown ? (
            <span
              className={cn(
                "absolute end-3 bottom-2 text-[10px] font-medium tabular-nums",
                remaining < 20 ? "text-red-500" : "text-nexa-ink-4",
              )}
            >
              {remaining}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all mb-0.5",
            disabled || !value.trim()
              ? "text-nexa-ink-4 cursor-not-allowed"
              : "text-nexa-primary hover:bg-nexa-primary/10 active:scale-95",
          )}
          aria-label={sendLabel}
        >
          <Send className="h-6 w-6 fill-current" />
        </button>
      </div>
    </footer>
  );
}
