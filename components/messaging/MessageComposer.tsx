"use client";

import React, { useCallback, useRef } from "react";
import { Mic, Paperclip, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;
const COUNTDOWN_THRESHOLD = 200;
const FEATURE_VOICE_MESSAGES = process.env.NEXT_PUBLIC_FEATURE_VOICE_MESSAGES === "true";

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
  onAttach?: () => void;
  attachDisabled?: boolean;
  uploadProgress?: number | null;
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
  onAttach,
  attachDisabled = false,
  uploadProgress,
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

  React.useEffect(() => {
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
    <footer className="shrink-0 z-50 border-t border-[#F7F7F7] bg-[rgba(252,249,248,0.92)] backdrop-blur-2xl px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {uploadProgress != null ? (
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-nexa-bg-2 w-full">
          <div
            className="h-full bg-nexa-primary transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      ) : null}
      <div className="flex w-full max-w-none items-end gap-2 lg:max-w-none">
        <button
          type="button"
          onClick={onAttach}
          disabled={attachDisabled || disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nexa-primary hover:bg-nexa-bg-2 disabled:opacity-40"
          aria-label="Attach"
        >
          <Paperclip className="h-5 w-5" />
        </button>

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
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-full border border-[#F7F7F7] bg-white px-4 py-2.5 text-base text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none focus:ring-2 focus:ring-nexa-primary/20 min-h-[44px] max-h-[120px]"
          />
          {showCountdown ? (
            <span className="absolute bottom-1 right-3 text-[10px] text-nexa-ink-4 tabular-nums">
              {remaining}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!FEATURE_VOICE_MESSAGES}
          title={FEATURE_VOICE_MESSAGES ? "Voice message" : "Voice messages coming soon"}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            FEATURE_VOICE_MESSAGES
              ? "text-nexa-primary hover:bg-nexa-bg-2"
              : "text-nexa-ink-4 opacity-40 cursor-not-allowed",
          )}
          aria-label="Voice message"
        >
          <Mic className="h-5 w-5" />
        </button>

        <button
          type="button"
          disabled
          title="Emoji picker coming soon"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nexa-ink-4 opacity-40"
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexa-primary text-white disabled:opacity-40 active:scale-95"
          aria-label={sendLabel}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </footer>
  );
}
