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
  onFilesDropped?: (files: FileList) => void;
  dropLabel?: string;
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
  onFilesDropped,
  dropLabel,
  attachDisabled = false,
  uploadProgress,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiAnchorRef = useRef<HTMLButtonElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
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

  const restoreComposerFocus = () => {
    setEmojiOpen(false);
    requestAnimationFrame(() => emojiAnchorRef.current?.focus());
  };

  if (readOnlyHint) {
    return (
      <div className="bg-gradient-to-t from-[#fdf7f9] via-[#fdf7f9] to-transparent px-4 pb-4 pt-3 text-center">
        <p className="mx-auto max-w-3xl rounded-full border border-nexa-primary/10 bg-white/95 px-4 py-3 text-sm font-medium text-nexa-ink-2 shadow-[0_10px_28px_rgba(112,52,78,0.10)]">{readOnlyHint}</p>
      </div>
    );
  }

  return (
    <footer
      className="relative shrink-0 bg-gradient-to-t from-[#fdf7f9] via-[#fdf9fa]/96 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      onDragEnter={(event) => {
        if (!disabled && !attachDisabled && event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDraggingFiles(true);
        }
      }}
      onDragOver={(event) => {
        if (!disabled && !attachDisabled && event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragLeave={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setDraggingFiles(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDraggingFiles(false);
        if (!disabled && !attachDisabled && event.dataTransfer.files.length) {
          onFilesDropped?.(event.dataTransfer.files);
        }
      }}
    >
      {draggingFiles ? (
        <div className="absolute inset-3 z-layer-content flex items-center justify-center rounded-[28px] border border-dashed border-nexa-primary bg-[linear-gradient(145deg,#fff,#fdf0f3)] text-sm font-semibold text-nexa-primary shadow-nexa-lg">
          {dropLabel}
        </div>
      ) : null}
      {uploadProgress != null ? (
        <div
          className="mx-auto mb-2 h-1 w-full max-w-3xl overflow-hidden rounded-full bg-nexa-bg-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(uploadProgress)}
        >
          <div
            className="h-full bg-[linear-gradient(90deg,#f4809a,#e8507a,#c93a62)] transition-all"
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
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-[28px] border border-nexa-primary/15 bg-white/95 p-1.5 shadow-[0_14px_38px_rgba(113,51,78,0.15)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => voice.cancel()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] hover:bg-nexa-primary-soft active:scale-95 motion-reduce:transition-none"
            aria-label={cancelLabel}
          >
            <Trash2 className="h-5 w-5" />
          </button>

          <div className="flex min-h-10 flex-1 items-center gap-3 px-2">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4809a,#e8507a_55%,#c93a62)] text-white shadow-[0_6px_16px_rgba(232,80,122,0.28)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_9px_21px_rgba(232,80,122,0.34)] active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
            aria-label={sendLabel}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="mx-auto flex max-w-3xl items-end gap-1 rounded-[28px] border border-nexa-primary/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,249,251,0.96))] p-1.5 shadow-[0_14px_38px_rgba(113,51,78,0.15)] backdrop-blur-xl transition-[border-color,box-shadow,transform] focus-within:border-nexa-primary/30 focus-within:shadow-[0_17px_46px_rgba(137,54,89,0.19)] motion-reduce:transition-none">
          <button
            type="button"
            onClick={onAttach}
            disabled={attachDisabled || disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] hover:bg-nexa-primary-soft active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
            aria-label="Attach"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>

          <div className="relative min-w-0 flex-1">
            <EmojiPickerPopover
              open={emojiOpen}
              onClose={restoreComposerFocus}
              onPick={insertEmoji}
              anchor={emojiAnchorRef}
            />
            <div className="relative flex items-end rounded-[22px] bg-transparent">
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
                className="max-h-[120px] min-h-10 w-full resize-none bg-transparent py-2.5 ps-2 pe-10 text-[15px] leading-5 text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none"
              />
              <button
                ref={emojiAnchorRef}
                type="button"
                onClick={() => setEmojiOpen((open) => !open)}
                disabled={disabled}
                className="absolute bottom-0.5 end-0.5 flex h-9 w-9 items-center justify-center rounded-full text-nexa-primary/80 transition-[background-color,color,transform] hover:bg-nexa-primary-soft hover:text-nexa-primary active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4809a,#e8507a_55%,#c93a62)] text-white shadow-[0_6px_16px_rgba(232,80,122,0.28)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_9px_21px_rgba(232,80,122,0.34)] active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
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
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95 disabled:opacity-40",
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
