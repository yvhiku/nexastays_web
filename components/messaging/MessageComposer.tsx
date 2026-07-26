"use client";

import React, { useCallback, useRef, useState } from "react";
import { Mic, Plus, Send, Smile, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttachmentActionPopover } from "@/components/messaging/AttachmentActionPopover";
import { EmojiPickerPopover } from "@/components/messaging/EmojiPickerPopover";
import { useVoiceRecorder } from "@/components/messaging/hooks/useVoiceRecorder";
import { useLanguage } from "@/contexts/LanguageContext";

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
  onAttachDocument?: () => void;
  onShareLocation?: () => void;
  attachmentLabels: {
    menu: string;
    photos: string;
    documents: string;
    location: string;
  };
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
  onAttachDocument,
  onShareLocation,
  attachmentLabels,
  onFilesDropped,
  dropLabel,
  attachDisabled = false,
  uploadProgress,
}: Props) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentAnchorRef = useRef<HTMLButtonElement>(null);
  const emojiAnchorRef = useRef<HTMLButtonElement>(null);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [uploadAnnouncement, setUploadAnnouncement] = useState("");
  const previousUploadProgress = useRef<number | null>(null);
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

  React.useEffect(() => {
    const previous = previousUploadProgress.current;
    if (uploadProgress != null) {
      setUploadAnnouncement(
        t("inbox.phase13.uploadProgress").replace(
          "{percent}",
          String(Math.round(uploadProgress)),
        ),
      );
    } else if (previous != null) {
      setUploadAnnouncement(t("inbox.phase13.uploadCompleted"));
    }
    previousUploadProgress.current = uploadProgress ?? null;
  }, [t, uploadProgress]);

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

  const closeAttachmentMenu = () => {
    setAttachmentOpen(false);
    requestAnimationFrame(() => attachmentAnchorRef.current?.focus());
  };

  if (readOnlyHint) {
    return (
      <div className="bg-gradient-to-t from-nexa-bg via-nexa-bg to-transparent px-4 pb-4 pt-3 text-center">
        <p className="mx-auto max-w-3xl rounded-messaging-composer border border-nexa-line bg-white px-4 py-3 text-sm font-medium text-nexa-ink-2 shadow-messaging-2">{readOnlyHint}</p>
      </div>
    );
  }

  return (
    <footer
      aria-label={t("inbox.phase13.composer")}
      className="relative min-w-0 shrink-0 overflow-x-hidden bg-gradient-to-t from-nexa-bg via-nexa-bg/95 to-transparent px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4"
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
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {uploadAnnouncement}
      </span>
      {draggingFiles ? (
        <div className="absolute inset-3 z-layer-content flex items-center justify-center rounded-messaging-composer border border-dashed border-nexa-primary bg-white text-sm font-semibold text-nexa-primary shadow-messaging-3">
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
        <div className="mx-auto flex min-w-0 max-w-3xl items-center gap-2 rounded-messaging-composer border border-nexa-line bg-white/95 p-2 shadow-messaging-2 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => voice.cancel()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none lg:h-10 lg:w-10"
            aria-label={cancelLabel}
          >
            <Trash2 className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
          </button>

          <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-1 sm:gap-3 sm:px-2 lg:min-h-10">
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden />
            <span className="min-w-0 truncate text-sm font-medium text-nexa-ink">{recordingLabel}</span>
            <span className="ms-auto tabular-nums text-sm text-nexa-ink-3">
              {voice.formatTime(voice.seconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleVoiceSend()}
            disabled={disabled}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#e8507a,#f06792)] text-white shadow-messaging-2 transition-[box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:shadow-messaging-3 active:scale-95 active:duration-messaging-press disabled:opacity-40 motion-reduce:transition-none lg:h-10 lg:w-10"
            aria-label={sendLabel}
          >
            <Send className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
          </button>
        </div>
      ) : (
        <div className="mx-auto flex min-w-0 max-w-3xl items-end gap-2 rounded-messaging-composer border border-nexa-line bg-white/95 p-2 shadow-messaging-2 backdrop-blur-xl transition-[border-color,box-shadow] duration-messaging-hover focus-within:border-nexa-primary/40 focus-within:shadow-messaging-3 motion-reduce:transition-none">
          <AttachmentActionPopover
            open={attachmentOpen}
            anchor={attachmentAnchorRef}
            labels={attachmentLabels}
            onClose={closeAttachmentMenu}
            onChoosePhotos={() => onAttach?.()}
            onChooseDocument={() => onAttachDocument?.()}
            onShareLocation={() => onShareLocation?.()}
          />
          <button
            ref={attachmentAnchorRef}
            type="button"
            onClick={() => {
              setEmojiOpen(false);
              setAttachmentOpen((open) => !open);
            }}
            disabled={attachDisabled || disabled}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-messaging-hover active:scale-95 active:duration-messaging-press disabled:opacity-40 motion-reduce:transition-none lg:h-10 lg:w-10",
              attachmentOpen
                ? "bg-nexa-primary-soft text-nexa-primary"
                : "text-nexa-ink-3 hover:bg-nexa-bg-2 hover:text-nexa-ink",
            )}
            aria-label={t("inbox.phase13.attach")}
            aria-expanded={attachmentOpen}
            aria-haspopup="menu"
          >
            <Plus className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
          </button>

          <div className="relative min-w-0 flex-1">
            <EmojiPickerPopover
              open={emojiOpen}
              onClose={restoreComposerFocus}
              onPick={insertEmoji}
              anchor={emojiAnchorRef}
            />
            <div className="relative flex items-end rounded-messaging-composer bg-transparent">
              <textarea
                ref={textareaRef}
                data-message-composer-input
                value={value}
                onChange={(e) => {
                  const next = e.target.value.slice(0, MAX_LENGTH);
                  onChange(next);
                  onActivity?.();
                }}
                onFocus={() => {
                  setEmojiOpen(false);
                  setAttachmentOpen(false);
                  onFocus?.();
                  onActivity?.();
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                aria-label={placeholder}
                disabled={disabled}
                rows={1}
                className="max-h-[40dvh] min-h-11 w-full resize-none bg-transparent py-3 ps-1.5 pe-12 text-[15px] leading-5 text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none sm:ps-2 lg:min-h-10 lg:py-2.5"
              />
              <button
                ref={emojiAnchorRef}
                type="button"
                onClick={() => {
                  setAttachmentOpen(false);
                  setEmojiOpen((open) => !open);
                }}
                disabled={disabled}
                className={cn(
                  "absolute bottom-0 end-0 flex h-12 w-12 items-center justify-center rounded-full transition-[background-color,color,transform] duration-messaging-hover active:scale-95 active:duration-messaging-press disabled:opacity-40 motion-reduce:transition-none lg:bottom-0 lg:end-0 lg:h-10 lg:w-10",
                  emojiOpen
                    ? "bg-nexa-primary-soft text-nexa-primary"
                    : "text-nexa-ink-3 hover:bg-nexa-bg-2 hover:text-nexa-ink",
                )}
                aria-label={t("inbox.phase13.emoji")}
                aria-expanded={emojiOpen}
              >
                <Smile className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#e8507a,#f06792)] text-white shadow-messaging-2 transition-[box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:shadow-messaging-3 active:scale-95 active:duration-messaging-press disabled:opacity-40 motion-reduce:transition-none lg:h-10 lg:w-10"
              aria-label={sendLabel}
            >
              <Send className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleVoiceTap()}
              disabled={disabled || !onVoiceRecorded}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press disabled:opacity-40 motion-reduce:transition-none lg:h-10 lg:w-10",
              )}
              aria-label={voiceLabel}
            >
              <Mic className="h-[22px] w-[22px] stroke-[1.75] lg:h-5 lg:w-5" />
            </button>
          )}
        </div>
      )}
    </footer>
  );
}
