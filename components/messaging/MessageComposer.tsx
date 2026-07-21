"use client";

import React, { useCallback, useRef, useState } from "react";
import { Mic, Plus, Send, Smile, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPickerPopover } from "@/components/messaging/EmojiPickerPopover";
import { useVoiceRecorder } from "@/components/messaging/hooks/useVoiceRecorder";

const MAX_LENGTH = 2000;
const COUNTDOWN_THRESHOLD = 200;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onVoiceRecorded?: (file: File) => void;
  disabled?: boolean;
  placeholder: string;
  sendLabel: string;
  voiceLabel: string;
  recordingLabel: string;
  cancelLabel: string;
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
  onVoiceRecorded,
  disabled = false,
  placeholder,
  sendLabel,
  voiceLabel,
  recordingLabel,
  cancelLabel,
  readOnlyHint,
  onFocus,
  onActivity,
  onAttach,
  attachDisabled = false,
  uploadProgress,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const voice = useVoiceRecorder();
  const remaining = MAX_LENGTH - value.length;
  const showCountdown = remaining <= COUNTDOWN_THRESHOLD;
  const hasText = value.trim().length > 0;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  React.useEffect(() => {
    resize();
  }, [value, resize]);

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange((value + emoji).slice(0, MAX_LENGTH));
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`.slice(0, MAX_LENGTH);
    onChange(next);
    onActivity?.();
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && hasText) onSend();
    }
  };

  const handleVoiceTap = async () => {
    if (disabled || voice.recording) return;
    voice.clearError();
    await voice.start();
  };

  const handleVoiceSend = async () => {
    const file = await voice.stop();
    if (file) onVoiceRecorded?.(file);
  };

  if (readOnlyHint) {
    return (
      <div className="border-t border-nexa-line/60 bg-nexa-bg-2 px-4 py-3 text-center">
        <p className="text-sm text-nexa-ink-3">{readOnlyHint}</p>
      </div>
    );
  }

  return (
    <footer className="shrink-0 border-t border-nexa-line/50 bg-[#fafafa] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {uploadProgress != null ? (
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-nexa-bg-2">
          <div
            className="h-full bg-nexa-primary transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      ) : null}

      {voice.error ? (
        <p className="mb-2 text-center text-xs text-red-600" role="alert">
          {voice.error}
        </p>
      ) : null}

      {voice.recording ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => voice.cancel()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg-2"
            aria-label={cancelLabel}
          >
            <Trash2 className="h-5 w-5" />
          </button>

          <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-full border border-nexa-line bg-white px-4">
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden />
            <span className="text-sm font-medium text-nexa-ink">{recordingLabel}</span>
            <span className="ms-auto tabular-nums text-sm text-nexa-ink-3">
              {voice.formatTime(voice.seconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleVoiceSend()}
            disabled={disabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexa-primary text-white active:scale-95 disabled:opacity-40"
            aria-label={sendLabel}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onAttach}
            disabled={attachDisabled || disabled}
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg-2 disabled:opacity-40"
            aria-label="Attach"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>

          <div className="relative min-w-0 flex-1">
            <EmojiPickerPopover
              open={emojiOpen}
              onClose={() => setEmojiOpen(false)}
              onPick={insertEmoji}
            />
            <div className="relative flex items-end rounded-full border border-nexa-line bg-white shadow-sm">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  const next = e.target.value.slice(0, MAX_LENGTH);
                  onChange(next);
                  onActivity?.();
                }}
                onFocus={() => {
                  setEmojiOpen(false);
                  onFocus?.();
                  onActivity?.();
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="max-h-[120px] min-h-[48px] w-full resize-none bg-transparent py-3 ps-4 pe-11 text-base text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEmojiOpen((open) => !open)}
                disabled={disabled}
                className="absolute bottom-1.5 end-1.5 flex h-9 w-9 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg-2 disabled:opacity-40"
                aria-label="Emoji"
                aria-expanded={emojiOpen}
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
            {showCountdown ? (
              <span className="absolute -top-5 end-2 text-[10px] tabular-nums text-nexa-ink-4">
                {remaining}
              </span>
            ) : null}
          </div>

          {hasText ? (
            <button
              type="button"
              onClick={onSend}
              disabled={disabled}
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexa-primary text-white active:scale-95 disabled:opacity-40"
              aria-label={sendLabel}
            >
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleVoiceTap()}
              disabled={disabled || !onVoiceRecorded}
              className={cn(
                "mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:scale-95 disabled:opacity-40",
                "text-nexa-primary hover:bg-nexa-primary-soft",
              )}
              aria-label={voiceLabel}
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </footer>
  );
}
